import terminal from "terminal-kit";
import * as ROT from "rot-js";
import { Aspect, World } from "gw-ecs/world";
import { System } from "gw-ecs/system";
import { PosManager, Pos } from "gw-ecs/utils";

class Term {
  term: terminal.Terminal;

  constructor(term: terminal.Terminal) {
    this.term = term;
  }
}

// SPRITE

class Sprite {
  ch: string;
  attr: terminal.ScreenBuffer.Attributes;

  constructor(ch: string, color: string) {
    this.ch = ch;
    this.attr = { color };
  }
}

const SPRITE_ASPECT = new Aspect(Sprite);

const WALL_SPRITE = new Sprite("#", "gray");
const FLOOR_SPRITE = new Sprite(".", "white");

// TILES

class Tile {
  blocks: boolean;

  constructor(blocks = false) {
    this.blocks = blocks;
  }
}

const TILE_ASPECT = new Aspect(Tile);

const WALL_TILE = new Tile(true);
const FLOOR_TILE = new Tile(false);

// DRAW SYSTEM

class DrawSystem extends System {
  _buf!: terminal.ScreenBuffer;

  start(world: World) {
    super.start(world);
    const term = world.getGlobal(Term).term;
    this._buf = new terminal.ScreenBuffer({ width: 80, height: 30, dst: term });
  }

  run(world: World): void {
    const buf = this._buf;
    const map = world.getGlobal(PosManager);

    map.everyXY((x, y, es) => {
      const entity = TILE_ASPECT.first(es)!;

      const sprite = entity.fetch(Sprite)!;
      buf.put({ x, y, attr: sprite.attr, dx: 1, dy: 0, wrap: true }, sprite.ch);
    }, new Aspect(Sprite));

    buf.draw();
  }
}

function digMap(world: World) {
  const digger = new ROT.Map.Digger(80, 25);
  const posMgr = world.getGlobal(PosManager);

  function digCallback(x: number, y: number, blocks: number) {
    const comps =
      blocks > 0 ? [WALL_TILE, WALL_SPRITE] : [FLOOR_TILE, FLOOR_SPRITE];
    posMgr.set(world.create(...comps), x, y);
  }

  digger.create(digCallback);
}

const term = terminal.terminal;

term.grabInput(true);

term.on("key", function (name, matches, data) {
  if (name === "CTRL_C" || name === "q") {
    term.moveTo(0, 26).eraseLine.blue("QUIT");
    term.grabInput(false);
    term.processExit(0);
  } else {
    term.moveTo(0, 26).eraseLine.defaultColor("'key' event: ", name);
    // TODO - Handle input
  }
});

const world = new World()
  .registerComponent(Sprite)
  .registerComponent(Tile)
  .setGlobal(new PosManager(80, 25))
  .setGlobal(new Term(term))
  .addSystem(new DrawSystem())
  .init(digMap)
  .start();

function run() {
  world.process(16);
  setTimeout(run, 16);
}

run();
