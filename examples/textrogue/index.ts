import terminal from "terminal-kit";
import { Entity } from "gw-ecs/entity/entity.js";
import { World } from "gw-ecs/world/world.js";
import { PosManager, Pos } from "gw-ecs/utils/positions.js";
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
  const mgr = world.get(PosManager);
  const [width, height] = mgr.size;

  for (let x = 0; x < width; ++x) {
    const top = world.create(new Wall());
    mgr.set(top, x, 0);

    const bottom = world.create(new Wall());
    mgr.set(bottom, x, height - 1);
  }

  for (let y = 1; y < height - 1; ++y) {
    const left = world.create(new Wall());
    mgr.set(left, 0, y);

    const right = world.create(new Wall());
    mgr.set(right, width - 1, y);
  }
}

// SYSTEMS

class DrawSystem extends System {
  _pos!: Pos;
  _mgr!: PosManager;
  _walls: Aspect = new Aspect().all(Wall);

  start(world: World) {
    super.start(world);
    this._mgr = world.get(PosManager);
    const store = world.getStore(Player);
    const entity = store.singleEntity()!;
    this._pos = entity.fetch(Pos)!;
  }

  protected doProcess(): void {
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
    super(new Aspect().all(Move, Pos));
  }
  protected processEntity(entity: Entity): void {
    const posMgr = this.world.get(PosManager)!;
    const pos = entity.update(Pos)!;
    const dir = entity.remove(Move)!.dir;
    const dxy = DIR[dir];

    if (posMgr.getAt(pos.x + dxy[0], pos.y + dxy[1], wallAspect).length == 0) {
      pos.x += dxy[0];
      pos.y += dxy[1];
      term("^g%s\n", dir);
    } else {
      term("^rblocked\n");
    }
  }
}

// STARTUP

const world = new World()
  .registerComponents(Wall, Player, Move)
  .init((w: World) => {
    const player = w.create(new Player());
    const posMgr = new PosManager(21, 21).init(w);
    posMgr.set(player, 11, 11);

    buildMaze(w);
  })
  .addSystem(new MoveSystem())
  .addSystem(new DrawSystem())
  .start();

const wallAspect = new Aspect().all(Wall);

// PLAY

async function play(world: World) {
  let running = true;
  const player = world.getStore(Player).singleEntity()!;

  while (running) {
    world.process();

    term("Command> ");
    let cmd = await term.inputField({
      autoComplete: ["left", "right", "up", "down", "help", "quit"],
    }).promise;

    cmd = cmd || "help";
    cmd = cmd.toLowerCase();
    term("\n");

    if (cmd[0] == "q") {
      term("^gok\n");
      process.exit(0);
    } else if (cmd[0] == "h") {
      term("^bCommands:\n");
      term(" - move: ^gleft^, ^gright^, ^gup^, ^gdown\n");
      term(" - ^ghelp\n");
      term(" - ^gquit\n");
    } else if (cmd[0] == "l") {
      player.add(new Move("left"));
    } else if (cmd[0] == "r") {
      player.add(new Move("right"));
    } else if (cmd[0] == "u") {
      player.add(new Move("up"));
    } else if (cmd[0] == "d") {
      player.add(new Move("down"));
    } else {
      term("Unknown command: ^r%s\n", cmd);
    }
  }
}

await play(world);

console.log("done");
