import terminal from "terminal-kit";
import { Entity } from "gw-ecs/entity/entity.js";
import { World } from "gw-ecs/world/world.js";
import { PosManager, Pos } from "gw-ecs/common/positions.js";
import { Aspect } from "gw-ecs/world/aspect.js";
import { System } from "gw-ecs/system/system.js";
import { EntitySystem } from "gw-ecs/system/entitySystem.js";

// COMPONENTS

class Wall {}
class Player {}
class Move {
  constructor(public dir: string) {}
}

// GLOBALS

const DIR: { [id: string]: [number, number] } = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

const term = terminal.terminal;

// HELPERS

function buildMaze(world: World) {
  const mgr = world.getUnique(PosManager);
  const [width, height] = mgr.size;

  // surround with walls

  for (let x = 0; x < width; ++x) {
    mgr.set(world.create(new Wall()), x, 0);
    mgr.set(world.create(new Wall()), x, height - 1);
  }

  for (let y = 1; y < height - 1; ++y) {
    mgr.set(world.create(new Wall()), 0, y);
    mgr.set(world.create(new Wall()), width - 1, y);
  }

  // put pillars every other square

  for (let x = 2; x < width; x += 2) {
    for (let y = 2; y < height; y += 2) {
      mgr.set(world.create(new Wall()), x, y);
    }
  }

  // now make it a maze...
}

// SYSTEMS

class DrawSystem extends System {
  _pos!: Pos;
  _mgr!: PosManager;
  _walls: Aspect = new Aspect(Wall);

  start(world: World) {
    super.start(world);
    this._mgr = world.getUnique(PosManager);
    const store = world.getStore(Player)!;
    const entity = store.singleEntity()!;
    this._pos = entity.fetch(Pos)!;
  }

  run(): void {
    for (let y = this._pos.y - 2; y <= this._pos.y + 2; ++y) {
      let out = ["^K.", "^K.", "^K.", "^K.", "^K."];
      for (let dx = 0; dx <= 4; ++dx) {
        const x = this._pos.x + dx - 2;
        if (this._pos.equals(x, y)) {
          out[dx] = "^b@";
        } else if (!this._mgr.hasXY(x, y)) {
          out[dx] = "^mX";
        } else if (this._mgr.getAt(x, y, this._walls).length > 0) {
          out[dx] = "^W#";
        }
      }

      term(out.join(""))("\n");
    }
  }
}

class MoveSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }
  processEntity(world: World, entity: Entity): void {
    const posMgr = world.getUnique(PosManager)!;
    const pos = entity.update(Pos)!;
    const dir = entity.remove(Move)!.dir;
    const dxy = DIR[dir];

    if (posMgr.getAt(pos.x + dxy[0], pos.y + dxy[1], wallAspect).length == 0) {
      posMgr.set(entity, pos.x + dxy[0], pos.y + dxy[1]);
      term("^g%s\n", dir);
    } else {
      term("^rblocked\n");
    }
  }
}

// STARTUP

const world = new World()
  .registerComponents(Wall, Player, Move)
  .setUnique(new PosManager(21, 21))
  .init((w: World) => {
    const player = w.create(new Player());
    w.setUnique(player); // put player entity in as resource to make getting it easier in systems
    w.getUnique(PosManager).set(player, 11, 11);
  })
  .addSystem(new MoveSystem())
  .addSystem(new DrawSystem())
  .init(buildMaze)
  .start();

const wallAspect = new Aspect(Wall);

// PLAY

async function play(world: World) {
  let running = true;
  const player = world.getUnique(Entity); // getStore(Player).singleEntity()!;

  while (running) {
    world.runSystems();

    term("Command> ");
    let cmd = await term.inputField({
      autoComplete: ["left", "right", "up", "down", "help", "quit"],
    }).promise;

    cmd = cmd || "help";
    cmd = cmd.toLowerCase();
    term("\n");

    if (cmd[0] == "q") {
      term("^gquit\n");
      term.processExit(0);
      running = false;
    } else if (cmd[0] == "h") {
      term("^bCommands:\n");
      term(" - move: ^gl[eft]^, ^gr[ight]^, ^gu[p]^, ^gd[own]\n");
      term(" - ^ghelp\n");
      term(" - ^gquit\n");
    } else if (cmd[0] == "l") {
      player.set(new Move("left"));
    } else if (cmd[0] == "r") {
      player.set(new Move("right"));
    } else if (cmd[0] == "u") {
      player.set(new Move("up"));
    } else if (cmd[0] == "d") {
      player.set(new Move("down"));
    } else {
      term("Unknown command: ^r%s\n", cmd);
    }
  }
}

await play(world);

console.log("done");
