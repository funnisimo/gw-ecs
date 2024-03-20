import terminal from "terminal-kit";
import * as ROT from "rot-js";
import { Aspect, World } from "gw-ecs/world";
import { EntitySystem, System } from "gw-ecs/system";
import { Pos, PosManager } from "gw-ecs/common";
import { Entity } from "gw-ecs/entity";

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

// OPEN

class Open {}

class OpenSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Open, Pos));
  }

  processEntity(world: World, entity: Entity): void {
    const term = world.getUnique(Term).term;
    const posMgr = world.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    entity.remove(Open);

    // There has to be a Tile entity on every square
    const boxEntity = posMgr.getAt(pos.x, pos.y, BOX_ASPECT)[0];
    if (!boxEntity) {
      term.moveTo(0, 26).eraseLine.red("Nothing to open.");
      return;
    }
    const box = boxEntity.fetch(Box)!;

    if (!box.ananas) {
      term.moveTo(0, 26).eraseLine.blue("Empty");
      world.queueDestroy(boxEntity);
    } else {
      term.moveTo(0, 26).eraseLine.green("You found the ^yananas^ !");
      term.processExit(0);
    }
  }
}

// MOVE

const DIRS: { [key: string]: { x: number; y: number } } = {
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
};

class Move {
  dirName: string;

  constructor(dirName: string) {
    this.dirName = dirName;
  }
}

class MoveSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }

  processEntity(world: World, entity: Entity): void {
    const term = world.getUnique(Term).term;
    const posMgr = world.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    const dirName = entity.remove(Move)!.dirName;
    const dxy = DIRS[dirName];
    const newX = pos.x + dxy.x;
    const newY = pos.y + dxy.y;

    // There has to be a Tile entity on every square
    const tile = posMgr.getAt(newX, newY, TILE_ASPECT)[0]!.fetch(Tile)!;

    if (!tile.blocks) {
      posMgr.set(entity, newX, newY);
      term.moveTo(0, 26).eraseLine.green(dirName);
    } else {
      term.moveTo(0, 26).eraseLine.red("Blocked: %s", dirName);
    }
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
  ananas: boolean;

  constructor(ananas = false) {
    this.ch = "*";
    this.attr = { color: "blue" };
    this.ananas = ananas;
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
    posMgr.set(world.create(new Box(count == 1)), loc.x, loc.y);
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

term.on("key", function (name, matches, data) {
  if (name === "CTRL_C" || name === "q") {
    term.moveTo(0, 26).eraseLine.blue("QUIT");
    term.grabInput(false);
    term.processExit(0);
  } else if (["LEFT", "RIGHT", "UP", "DOWN"].includes(name)) {
    const hero = world.getUnique(Entity);
    hero.set(new Move(name));
  } else if ([" ", "ENTER"].includes(name)) {
    const hero = world.getUnique(Entity);
    hero.set(new Open());
  } else {
    term.moveTo(0, 26).eraseLine.red("Unknown key: ", name);
  }
});

const world = new World()
  .registerComponent(Tile)
  .registerComponent(Box)
  .registerComponent(Hero)
  .registerComponent(Move)
  .registerComponent(Open)
  .setUnique(new PosManager(80, 25))
  .setUnique(new Term(term))
  .addSystem(new MoveSystem())
  .addSystem(new OpenSystem())
  .addSystem(new DrawSystem())
  .init(digMap)
  .start();

function run() {
  world.addTime(16).runSystems();
  setTimeout(run, 16);
}

run();
