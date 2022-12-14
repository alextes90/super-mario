// "use strict";
kaboom({
  global: true,
  fullscreen: true,
  scale: 1.5,
  debug: true,
  clearColor: [0, 0, 0, 1],
});

const MOVE_SPEED = 120;
const JUMP_FORCE = 360;
const BIG_JUMP_FORCE = 450;
const ENEMY_SPEED = 50;
const FALL_DEATH = 400;
let CURRENT_JUMP_FORCE = JUMP_FORCE;
let isJumping = false;
let CURRENT_ENEMY_SPEED = -ENEMY_SPEED;

loadSprite("coin", "Coin.png");
loadSprite("evil-shroom", "evil-shroom.png");
loadSprite("brick", "brick.png");
loadSprite("block", "Block.png");
loadSprite("mario", "mario.png");
loadSprite("mushroom", "mushroom.png");
loadSprite("surprise", "surprise.png");
loadSprite("unboxed", "unboxed.png");
loadSprite("pipe-top-left", "pipe-top-left.png");
loadSprite("pipe-top-right", "pipe-top-right.png");
loadSprite("pipe-bottom-left", "pipe-bottom-left.png");
loadSprite("pipe-bottom-right", "pipe-bottom-right.png");

loadSprite("blueBlock", "blueBlock.png");
loadSprite("blueBrick", "blueBrick.png");
loadSprite("blueEvilShroom", "blueEvilShroom.png");
loadSprite("blueUnboxed", "blueUnboxed.png");

scene("game", ({ level, score }) => {
  layers(["bg", "obj", "ui"], "obj");

  const maps = [
    [
      "                                           ",
      "                                           ",
      "                                           ",
      "                                           ",
      "                                           ",
      "                                           ",
      "    %  =*=%=                               ",
      "                                           ",
      "                            -+             ",
      "                 =   ^  ^   ()             ",
      "================================   ========",
    ],
    [
      "/                                          /",
      "/                                          /",
      "/                                          /",
      "/                                          /",
      "/                                          /",
      "/                                          /",
      "/       %%%%%%%                   x        /",
      "/                               x x        /",
      "/                             x x x x   -+ /",
      "/              z    z     x x x x x x x () /",
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    ],
    [
      "                                           ",
      "                                           ",
      "                                           ",
      "                                           ",
      "                                           ",
      "                                           ",
      "    %  =*=%=                               ",
      "                                           ",
      "                            -+             ",
      "                     ^  ^   ()             ",
      "================================   ========",
    ],
  ];

  const levelCfg = {
    width: 20,
    height: 20,
    "=": [sprite("block"), solid(), "block"],
    $: [sprite("coin"), "coin"],
    "%": [sprite("surprise"), solid(), "coin-surprise"],
    "*": [sprite("surprise"), solid(), "mushroom-surprise"],
    "}": [sprite("unboxed"), solid()],
    ")": [sprite("pipe-bottom-left"), solid(), scale(0.5)],
    "(": [sprite("pipe-bottom-right"), solid(), scale(0.5)],
    "-": [sprite("pipe-top-left"), solid(), scale(0.5), "pipe"],
    "+": [sprite("pipe-top-right"), solid(), scale(0.5), "pipe"],
    "^": [sprite("evil-shroom"), solid(), "dangerous", body()],
    "#": [sprite("mushroom"), solid(), "mushroom", body(), origin("bot")],
    "!": [sprite("blueBlock"), solid(), scale(0.5), "block"],
    "/": [sprite("blueBrick"), solid(), scale(0.5), "block"],
    z: [sprite("blueEvilShroom"), solid(), scale(0.5), "dangerous", body()],
    x: [sprite("blueUnboxed"), solid(), scale(0.5)],
  };

  const gameLevel = addLevel(maps[level], levelCfg);

  const scoreLabel = add([
    text(score),
    pos(30, 6),
    layer("ui"),
    {
      value: score,
    },
  ]);

  add([text("level " + parseInt(level + 1)), pos(40, 6)]);

  function big() {
    let timer = 0;
    let isBig = false;
    return {
      update() {
        if (isBig) {
          timer -= dt();
          if (timer <= 0) {
            this.smallify();
          }
        }
      },
      isBig() {
        return isBig;
      },
      smallify() {
        this.scale = vec2(1);
        CURRENT_JUMP_FORCE = JUMP_FORCE;
        timer = 0;
        isBig = false;
      },
      biggify(time) {
        this.scale = vec2(1.5);
        CURRENT_JUMP_FORCE = BIG_JUMP_FORCE;
        timer = time;
        isBig = true;
      },
    };
  }

  const player = add([
    sprite("mario"),
    solid(),
    pos(30, 0),
    body(),
    big(),
    origin("bot"),
  ]);

  action("mushroom", (m) => {
    m.move(70, 0);
  });

  player.on("headbump", (obj) => {
    if (obj.is("coin-surprise")) {
      gameLevel.spawn("$", obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn("}", obj.gridPos.sub(0, 0));
    }
    if (obj.is("mushroom-surprise")) {
      gameLevel.spawn("#", obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn("}", obj.gridPos.sub(0, 0));
    }
  });

  player.collides("mushroom", (m) => {
    destroy(m);
    player.biggify(10);
  });

  player.collides("coin", (c) => {
    destroy(c);
    scoreLabel.value++;
    scoreLabel.text = scoreLabel.value;
  });

  action("dangerous", (d) => {
    d.move(CURRENT_ENEMY_SPEED, 0);
    if (d.pos.x <= 0) {
      CURRENT_ENEMY_SPEED = ENEMY_SPEED * -2;
    }
    d.collides("pipe", () => {
      CURRENT_ENEMY_SPEED = ENEMY_SPEED * -2;
    });
    d.collides("block", () => {
      CURRENT_ENEMY_SPEED = ENEMY_SPEED * -2;
    });
  });

  player.collides("dangerous", (d) => {
    if (isJumping) {
      destroy(d);
    } else {
      go("lose", {
        score: scoreLabel.value,
      });
    }
  });

  player.action(() => {
    // camPos(player.pos);
    if (player.pos.y >= FALL_DEATH) {
      go("lose", { score: scoreLabel.value });
    }
  });

  player.collides("pipe", () => {
    keyPress("down", () => {
      go("game", {
        level: (level + 1) % maps.length,
        score: scoreLabel.value,
      });
    });
  });

  keyDown("left", () => {
    player.move(-MOVE_SPEED, 0);
  });

  keyDown("right", () => {
    player.move(MOVE_SPEED, 0);
  });

  player.action(() => {
    if (player.grounded()) {
      isJumping = false;
    }
  });

  keyPress("up", () => {
    if (player.grounded()) {
      isJumping = true;
      player.jump(CURRENT_JUMP_FORCE);
    }
  });
});
scene("lose", ({ score }) => {
  add([
    text(`You lose!\n\nscore:${score}`, 32),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
});

start("game", { level: 0, score: 0 });
