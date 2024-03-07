import terminal from "terminal-kit";
import * as ROT from "rot-js";
import { Aspect, World } from "gw-ecs/world";
import { System } from "gw-ecs/system";
import { PosManager, Pos } from "gw-ecs/utils";

type XY = { x: number; y: number };

class Term {
  term: terminal.Terminal;

  constructor(term: terminal.Terminal) {
    this.term = term;
  }
}

// BOXES

class Box {
  ananas: boolean;

  constructor(ananas = false) {
    this.ananas = ananas;
  }
}

const BOX_ASPECT = new Aspect(Box);

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
const BOX_SPRITE = new Sprite("*", "brightBlue");

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
      const entity = BOX_ASPECT.first(es) || TILE_ASPECT.first(es)!;

      const sprite = entity.fetch(Sprite)!;
      buf.put({ x, y, attr: sprite.attr, dx: 1, dy: 0, wrap: true }, sprite.ch);
    }, new Aspect(Sprite));

    buf.draw();
  }
}

function digMap(world: World) {
  const digger = new ROT.Map.Digger(80, 25);
  const posMgr = world.getGlobal(PosManager);
  const floors: XY[] = [];

  function digCallback(x: number, y: number, blocks: number) {
    const comps =
      blocks > 0 ? [WALL_TILE, WALL_SPRITE] : [FLOOR_TILE, FLOOR_SPRITE];
    posMgr.set(world.create(...comps), x, y);

    if (!blocks) floors.push({ x, y });
  }

  digger.create(digCallback);

  placeBoxes(world, 10, floors);
}

function placeBoxes(world: World, count: number, locs: XY[]) {
  count = Math.min(count, locs.length);
  const posMgr = world.getGlobal(PosManager);

  while (count) {
    var index = Math.floor(ROT.RNG.getUniform() * locs.length);
    var loc = locs.splice(index, 1)[0];
    posMgr.set(world.create(new Box(count == 1), BOX_SPRITE), loc.x, loc.y);
    count -= 1;
  }
}

const term = terminal.terminal;
term.clear();

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
  .registerComponent(Box)
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
