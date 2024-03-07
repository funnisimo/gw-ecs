import terminal from "terminal-kit";
import * as ROT from "rot-js";
import { Aspect, World } from "gw-ecs/world";
import { EntitySystem, System } from "gw-ecs/system";
import { Pos, PosManager } from "gw-ecs/utils";
import { Entity } from "gw-ecs/entity";

type XY = { x: number; y: number };

class Term {
  term: terminal.Terminal;

  constructor(term: terminal.Terminal) {
    this.term = term;
  }
}

// GAME INFO

class GameInfo {
  hero: Entity;
  takeTurn: boolean;

  constructor(hero: Entity, takeTurn = false) {
    this.hero = hero;
    this.takeTurn = takeTurn;
  }
}

abstract class EntityTurnSystem extends EntitySystem {
  shouldRun(world: World, time: number, delta: number): boolean {
    return (
      super.shouldRun(world, time, delta) && world.getGlobal(GameInfo).takeTurn
    );
  }
}

class TurnOverSystem extends System {
  protected process(world: World): void {
    const game = world.getGlobal(GameInfo);
    game.takeTurn = false;
  }
}

// OPEN

class Open {}

class OpenSystem extends EntityTurnSystem {
  constructor() {
    super(new Aspect(Open, Pos));
  }

  protected processEntity(entity: Entity, world: World): void {
    const term = world.getGlobal(Term).term;
    const posMgr = world.getGlobal(PosManager);
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
      term.moveTo(0, 26).eraseLine.green("Empty");
      boxEntity.add(EMPTY_BOX_SPRITE);
    } else {
      term.moveTo(0, 26).eraseLine.green("You found the ^yananas^ !");
      term.processExit(0);
    }
  }
}

// MOVE

const DIRS: { [key: string]: XY } = {
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
};

class Move {
  dir: XY;

  constructor(dir: XY) {
    this.dir = dir;
  }
}

class MoveSystem extends EntityTurnSystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }

  protected processEntity(entity: Entity, world: World): void {
    const term = world.getGlobal(Term).term;
    const posMgr = world.getGlobal(PosManager);
    const pos = entity.fetch(Pos)!;

    const dxy = entity.remove(Move)!.dir;
    const newX = pos.x + dxy.x;
    const newY = pos.y + dxy.y;

    // There has to be a Tile entity on every square
    const tile = posMgr.getAt(newX, newY, TILE_ASPECT)[0]!.fetch(Tile)!;

    if (!tile.blocks) {
      posMgr.set(entity, newX, newY);
      if (entity.has(Hero)) {
        term.moveTo(0, 26).eraseLine.green("Move");
      }
    } else {
      if (entity.has(Hero)) {
        term.moveTo(0, 26).eraseLine.red("Blocked");
      }
    }
  }
}

// HERO

class Hero {}

const HERO_ASPECT = new Aspect(Hero);

// PEDRO

class Pedro {
  path: Pos[] | null = null;
}

const PEDRO_ASPECT = new Aspect(Pedro);

class PedroSystem extends EntityTurnSystem {
  constructor() {
    super(new Aspect(Pedro));
  }

  protected processEntity(entity: Entity, world: World): void {
    const pedro = entity.update(Pedro)!;
    const pedroPos = entity.fetch(Pos)!;

    if (!pedro.path || pedro.path.length == 0) {
      // Pick a random box...
      const boxes = [...world.getStore(Box).entities()];
      const box = ROT.RNG.getItem(boxes)!;
      // Find a path to that box...
      const boxPos = box.fetch(Pos)!;

      const posMgr = world.getGlobal(PosManager);
      /* prepare path to given coords */
      var astar = new ROT.Path.AStar(
        boxPos.x,
        boxPos.y,
        (x, y) => {
          const entity = posMgr.getAt(x, y, TILE_ASPECT)[0]!;
          const tile = entity.fetch(Tile)!;
          return !tile.blocks;
        },
        { topology: 4 } // Only cardinal directions
      );

      /* compute from given coords #1 */
      pedro.path = [];
      astar.compute(pedroPos.x, pedroPos.y, function (x, y) {
        pedro.path!.push(new Pos(x, y));
      });

      if (!pedro.path.length) {
        throw new Error("Failed to find path for Pedro!");
      }

      // pop the first step in the path off b/c it is Pedro's location
      pedro.path.splice(0, 1);

      term
        .moveTo(0, 27)
        .eraseLine.blue(
          "PATH - " + pedro.path.map((o) => `${o.x},${o.y}`).join(", ")
        );
    }

    // Pick the next step in the path
    const dest = pedro.path.splice(0, 1)[0];
    const dir = dest.minus(pedroPos);
    entity.add(new Move(dir));
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
const HERO_SPRITE = new Sprite("@", "yellow");
const BOX_SPRITE = new Sprite("*", "brightBlue");
const EMPTY_BOX_SPRITE = new Sprite("*", "green");
const PEDRO_SPRITE = new Sprite("P", "red");

// BOXES

class Box {
  ananas: boolean;

  constructor(ananas = false) {
    this.ananas = ananas;
  }
}

const BOX_ASPECT = new Aspect(Box);

// TILES

class Tile {
  blocks: boolean;

  constructor(blocks = false) {
    this.blocks = blocks;
  }
}

const TILE_ASPECT = new Aspect(Tile);

class DrawSystem extends System {
  _buf!: terminal.ScreenBuffer;

  start(world: World) {
    super.start(world);
    const term = world.getGlobal(Term).term;
    this._buf = new terminal.ScreenBuffer({ width: 80, height: 30, dst: term });
  }

  protected process(world: World): void {
    const buf = this._buf;
    const map = world.getGlobal(PosManager);

    map.everyXY((x, y, es) => {
      const entity =
        HERO_ASPECT.first(es) ||
        PEDRO_ASPECT.first(es) ||
        BOX_ASPECT.first(es) ||
        TILE_ASPECT.first(es)!;

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
    const sprite = blocks ? WALL_SPRITE : FLOOR_SPRITE;
    posMgr.set(world.create(new Tile(!!blocks), sprite), x, y);

    if (!blocks) {
      floors.push({ x, y });
    }
  }

  digger.create(digCallback);

  const loc = placeHero(world, floors);
  placePedro(world, loc, floors);
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

function placeHero(world: World, locs: XY[]): XY {
  const posMgr = world.getGlobal(PosManager);
  var index = Math.floor(ROT.RNG.getUniform() * locs.length);
  var loc = locs.splice(index, 1)[0];
  const hero = world.create(new Hero(), HERO_SPRITE);
  posMgr.set(hero, loc.x, loc.y);
  world.setGlobal(new GameInfo(hero));
  return loc;
}

function placePedro(world: World, avoidLoc: XY, locs: XY[]) {
  const posMgr = world.getGlobal(PosManager);

  // We need to find a place far from our hero so that they have a chance to get going before Pedro
  // bears down on them.
  const dist = locs.map(
    (xy) => Math.abs(avoidLoc.x - xy.x) + Math.abs(avoidLoc.y - xy.y)
  );
  const maxDist = Math.max(...dist);
  const index = dist.indexOf(maxDist);
  var loc = locs.splice(index, 1)[0];

  const pedro = world.create(new Pedro(), PEDRO_SPRITE);
  posMgr.set(pedro, loc.x, loc.y);
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
    const game = world.getGlobal(GameInfo);
    game.hero.add(new Move(DIRS[name]));
    game.takeTurn = true;
  } else if ([" ", "ENTER"].includes(name)) {
    const game = world.getGlobal(GameInfo);
    game.hero.add(new Open());
    game.takeTurn = true;
  } else {
    term.moveTo(0, 26).eraseLine.red("Unknown key: ", name);
  }
});

const world = new World()
  .registerComponent(Tile)
  .registerComponent(Box)
  .registerComponent(Hero)
  .registerComponent(Pedro)
  .registerComponent(Move)
  .registerComponent(Open)
  .registerComponent(Sprite)
  .setGlobal(new PosManager(80, 25))
  .setGlobal(new Term(term))
  .addSystem(new PedroSystem())
  .addSystem(new MoveSystem())
  .addSystem(new OpenSystem())
  .addSystem(new DrawSystem())
  .addSystem(new TurnOverSystem())
  .init(digMap)
  .start();

function run() {
  world.process(16);
  setTimeout(run, 16);
}

run();
