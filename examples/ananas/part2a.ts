import terminal from "terminal-kit";
import * as ROT from "rot-js";
import { World } from "gw-ecs/world";
import { System } from "gw-ecs/system";
import { PosManager } from "gw-ecs/common/positions";
import { Aspect } from "gw-ecs/entity";

function ifDo<T>(maybeVal: T, doFn: (t: NonNullable<T>) => any): boolean {
  if (!maybeVal) return false;
  doFn(maybeVal);
  return true;
}

class Term {
  term: terminal.Terminal;

  constructor(term: terminal.Terminal) {
    this.term = term;
  }
}

// HERO

class Hero {
  ch: string;
  attr: terminal.ScreenBuffer.Attributes;

  constructor() {
    this.ch = "@";
    this.attr = { color: "yellow" };
  }
}

const HERO_ASPECT = new Aspect(Hero);

// BOXES

class Box {
  ch: string;
  attr: terminal.ScreenBuffer.Attributes;

  constructor() {
    this.ch = "*";
    this.attr = { color: "blue" };
  }
}

const BOX_ASPECT = new Aspect(Box);

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

class DrawSystem extends System {
  _buf!: terminal.ScreenBuffer;

  start(world: World) {
    super.start(world);
    const term = world.getUnique(Term).term;
    this._buf = new terminal.ScreenBuffer({ width: 80, height: 30, dst: term });
  }

  run(world: World): void {
    const buf = this._buf;
    const map = world.getUnique(PosManager);

    map.everyXY((x, y, es) => {
      ifDo(HERO_ASPECT.first(es), (e) => {
        const hero = e.fetch(Hero)!;
        buf.put({ x, y, attr: hero.attr, dx: 1, dy: 0, wrap: true }, hero.ch);
      }) ||
        ifDo(BOX_ASPECT.first(es), (e) => {
          const box = e.fetch(Box)!;
          buf.put({ x, y, attr: box.attr, dx: 1, dy: 0, wrap: true }, box.ch);
        }) ||
        ifDo(TILE_ASPECT.first(es), (e) => {
          const tile = e.fetch(Tile)!;
          buf.put({ x, y, attr: tile.attr, dx: 1, dy: 0, wrap: true }, tile.ch);
        });
    });

    buf.draw();
  }
}

function digMap(world: World) {
  const digger = new ROT.Map.Digger(80, 25);
  const posMgr = world.getUnique(PosManager);
  const floors: { x: number; y: number }[] = [];

  function digCallback(x: number, y: number, value: number) {
    const tile = value ? WALL : FLOOR;
    posMgr.set(world.create(tile), x, y);

    if (!value) {
      floors.push({ x, y });
    }
  }

  digger.create(digCallback);

  placeHero(world, floors);
  placeBoxes(world, 10, floors);
}

function placeBoxes(
  world: World,
  count: number,
  locs: { x: number; y: number }[]
) {
  count = Math.min(count, locs.length);
  const posMgr = world.getUnique(PosManager);

  while (count) {
    var index = Math.floor(ROT.RNG.getUniform() * locs.length);
    var loc = locs.splice(index, 1)[0];
    posMgr.set(world.create(new Box()), loc.x, loc.y);
    count -= 1;
  }
}

function placeHero(world: World, locs: { x: number; y: number }[]) {
  const posMgr = world.getUnique(PosManager);
  var index = Math.floor(ROT.RNG.getUniform() * locs.length);
  var loc = locs.splice(index, 1)[0];
  const hero = world.create(new Hero());
  posMgr.set(hero, loc.x, loc.y);
  world.setUnique(hero);
}

const term = terminal.terminal;
term.clear();

term.grabInput(true);

term.on("key", function (name: string) {
  if (name === "CTRL_C" || name === "q") {
    term.moveTo(0, 26).eraseLine.blue("QUIT");
    term.grabInput(false);
    term.processExit(0);
  } else {
    term.moveTo(0, 26).eraseLine.red("Unknown key: ", name);
  }
});

const world = new World()
  .registerComponent(Tile)
  .registerComponent(Box)
  .registerComponent(Hero)
  .setUnique(new PosManager(80, 25))
  .setUnique(new Term(term))
  .addSystem(new DrawSystem())
  .init(digMap)
  .start();

function run() {
  world.addTime(16).runSystems();
  setTimeout(run, 16);
}

run();
