import terminal from "terminal-kit";
import { World } from "gw-ecs/world/world.js";
import { PosManager, Pos } from "gw-ecs/utils/positions.js";
import { Aspect } from "gw-ecs/world/aspect.js";

function buildMaze(world: World, mgr: PosManager) {
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

class Wall {}
class Player {}

const term = terminal.terminal;

const world = new World().registerComponents(Wall, Player);
const posMgr = new PosManager(21, 21).init(world);

buildMaze(world, posMgr);

const player = world.create(new Player());
posMgr.set(player, 11, 11);

async function play() {
  const wallAspect = new Aspect().all(Wall);

  let running = true;

  while (running) {
    let pos = player.update(Pos);

    for (let y = pos.y - 1; y <= pos.y + 1; ++y) {
      let out = "";
      for (let x = pos.x - 1; x <= pos.x + 1; ++x) {
        if (pos.equals(x, y)) {
          out += "@";
        } else if (!posMgr.hasXY(x, y)) {
          out += "X";
        } else if (posMgr.getAt(x, y, wallAspect).length > 0) {
          out += "#";
        } else {
          out += ".";
        }
      }

      term(out)("\n");
    }

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
      if (posMgr.getAt(pos.x - 1, pos.y, wallAspect).length == 0) {
        pos.x -= 1;
      } else {
        term("^rblocked\n");
      }
    } else if (cmd[0] == "r") {
      if (posMgr.getAt(pos.x + 1, pos.y, wallAspect).length == 0) {
        pos.x += 1;
      } else {
        term("^rblocked\n");
      }
    } else if (cmd[0] == "u") {
      if (posMgr.getAt(pos.x, pos.y - 1, wallAspect).length == 0) {
        pos.y -= 1;
      } else {
        term("^rblocked\n");
      }
    } else if (cmd[0] == "d") {
      if (posMgr.getAt(pos.x, pos.y + 1, wallAspect).length == 0) {
        pos.x += 1;
      } else {
        term("^rblocked\n");
      }
    } else {
      term("Unknown command: ^r%s\n", cmd);
    }
  }
}

await play();

console.log("done");
