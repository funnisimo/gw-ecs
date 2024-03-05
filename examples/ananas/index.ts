import terminal from "terminal-kit";
import * as ROT from "rot-js";
import { Aspect, World } from "gw-ecs/world";
import { System } from "gw-ecs/system";
import { PosManager } from "gw-ecs/utils";
import { Entity } from "gw-ecs/entity/entity";

// function ifDo<T>(maybeTrueVal: T, doFn: (t: T) => any): boolean {
//   if (maybeTrueVal) {
//     doFn(maybeTrueVal);
//     return true;
//   }
//   return false;
// }

class Term {
  term: terminal.Terminal;

  constructor(term: terminal.Terminal) {
    this.term = term;
  }
}

// TILES

class Tile {
  ch: string;
  attr: terminal.ScreenBuffer.Attributes;
  blocks: boolean;

  constructor(ch: string, color: string, blocks = false) {
    this.ch = ch;
    this.attr = { color };
    this.blocks = blocks;
  }
}

const WALL = new Tile("#", "gray", true);
const FLOOR = new Tile(".", "white");

const TILE_ASPECT = new Aspect(Tile);

function HAS_TILE(e: Entity): boolean {
  return TILE_ASPECT.match(e);
}

class DrawSystem extends System {
  _buf!: terminal.ScreenBuffer;

  start(world: World) {
    super.start(world);
    const term = world.getGlobal(Term).term;
    this._buf = new terminal.ScreenBuffer({ width: 80, height: 30, dst: term });
  }

  protected doProcess(): void {
    const buf = this._buf;
    const map = this.world.getGlobal(PosManager);

    map.everyXY((x, y, es) => {
      const tileEntity = es[0]; // Every x,y has a tile so we know we will get an entity
      const tile = tileEntity.fetch(Tile)!;
      buf.put({ x, y, attr: tile.attr, dx: 1, dy: 0, wrap: true }, tile.ch);
    }, TILE_ASPECT);

    buf.draw();
  }
}

function digMap(world: World) {
  const digger = new ROT.Map.Digger(80, 25);
  const posMgr = world.getGlobal(PosManager);

  function digCallback(x: number, y: number, value: number) {
    const tile = value ? WALL : FLOOR;
    posMgr.set(world.create(tile), x, y);
  }

  digger.create(digCallback);
}

const term = terminal.terminal;
const world = new World()
  .registerComponent(Tile)
  .setGlobal(new PosManager(80, 25), (w, r) => r.init(w))
  .setGlobal(new Term(term))
  .addSystem(new DrawSystem())
  .init(digMap)
  .start();

term.grabInput(true);

term.on("key", function (name, matches, data) {
  console.log("'key' event:", name);
  if (name === "CTRL_C" || name === "q") {
    term.grabInput(false);
    term.processExit(0);
  } else {
    // TODO - Handle input
  }
});

function run() {
  world.process(16);
  setTimeout(run, 16);
}

run();