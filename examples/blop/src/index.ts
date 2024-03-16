import * as GWU from "gw-utils";
import * as Constants from "./constants";
import type { ColorBase } from "gw-utils/color";
import { Aspect, World } from "gw-ecs/world";
import { Hero, Move, Sprite, Tile } from "./comps";
import { nextLevel } from "./map/nextLevel";
import { Pos, PosManager } from "gw-ecs/utils/positions";
import { logs, addLog } from "./ui/log";
import { CollisionManager } from "gw-ecs/utils/collisions";
import { MoveSystem } from "./systems";
import { Game } from "./uniques";

console.log("Hello, search for the " + Constants.BLOPULET_NAME);

function blockedMove() {
  addLog("Blocked");
  // Does not count as turn for actor (esp hero)
  return true; // We handled the collision
}

function gotoNextLevel() {
  nextLevel(world);
}

const world = new World()
  .registerComponent(Hero)
  .registerComponent(Tile)
  .registerComponent(Sprite)
  .registerComponent(Move)
  .addSystem(new MoveSystem())
  .setUnique(new Game())
  .setUnique(new CollisionManager(), (col) => {
    col
      // .register(["hero"], ["blop"], attack)
      // .register(["blop"], ["hero"], attack)
      .register("actor", "wall", blockedMove)
      .register("hero", "stairs", gotoNextLevel);
  });

const gw = GWU.app.start({
  div: "game",
  width: 50,
  height: 40,
  tileWidth: 15,
  scene: {
    start() {
      nextLevel(world);
    },
    click(ev: GWU.app.Event) {
      if (ev.x < Constants.MAP_WIDTH) {
        if (ev.y >= Constants.MAP_TOP && ev.y < Constants.LOG_TOP - 2) {
          const x = ev.x;
          const y = ev.y - Constants.MAP_TOP;

          const mgr = world.getUnique(PosManager);
          const entities = mgr.getAt(x, y);
          console.log("map click", x, y, entities);
          return;
        }
      }
      console.log("click", ev.x, ev.y);
    },
    keypress(this: GWU.app.Scene, ev: GWU.app.Event) {
      const game = world.getUnique(Game);
      if (ev.dir) {
        const hero = game.hero;
        if (hero) {
          console.log("keypress - move", ev.dir);
          hero.set(new Move(ev.dir));
        }
      } else if (ev.key == " ") {
        nextLevel(world);
        game.changed = true;
      } else {
        console.log("key", ev.key);
      }
    },
    update(dt: number) {
      world.runSystems(dt);
      const game = world.getUnique(Game);
      this.needsDraw = game.changed;
      game.changed = false;
    },
    draw(buffer: GWU.buffer.Buffer) {
      drawLineH(buffer, 0, 5, 50, "-", "white", "black");
      drawLineV(buffer, 20, 6, 22, "|", "white", "black");
      drawLineH(buffer, 0, 7, 20, "-", "white", "black");
      drawLineH(buffer, 0, 28, 50, "-", "white", "black");

      drawMap(buffer, world, 0, 8);
      drawLog(buffer, 0, 29);
      // GWU.xy.forRect(buffer.width, buffer.height, (x, y) => {
      //   const ch = String.fromCharCode(65 + GWU.rng.random.number(26));
      //   const fg = GWU.rng.random.number(0x1000);
      //   const bg = GWU.rng.random.number(0x1000);
      //   buffer.draw(x, y, ch, fg, bg);
      // });
    },
  },
});

const HERO_ASPECT = new Aspect(Hero);
const TILE_ASPECT = new Aspect(Tile);

function drawMap(
  buffer: GWU.buffer.Buffer,
  world: World,
  x0: number,
  y0: number
) {
  const mgr = world.getUnique(PosManager);

  mgr.everyXY((x, y, entities) => {
    if (entities.length == 0) {
      buffer.draw(x + x0, y + y0, "?", "red");
    } else {
      const entity =
        HERO_ASPECT.first(entities) ||
        // PEDRO_ASPECT.first(entities) ||
        // BOX_ASPECT.first(entities) ||
        TILE_ASPECT.first(entities)!;

      const sprite = entity.fetch(Sprite)!;
      buffer.draw(x + x0, y + y0, sprite.ch, sprite.fg, sprite.bg);
    }
  }, new Aspect(Pos, Sprite));
}

function drawLog(buffer: GWU.buffer.Buffer, x0: number, y0: number) {
  for (let i = 0; i < Constants.LOG_HEIGHT; ++i) {
    let y = Constants.LOG_TOP + Constants.LOG_HEIGHT - i - 1;
    const log = logs[i];
    const msg = log ? log.msg : "";
    buffer.drawText(Constants.LOG_LEFT, y, msg);
  }
}

function drawLineH(
  buffer: GWU.buffer.Buffer,
  x: number,
  y: number,
  w: number,
  ch: string,
  fg: ColorBase,
  bg: ColorBase
) {
  for (let dx = 0; dx < w; ++dx) {
    buffer.draw(x + dx, y, ch, fg, bg);
  }
}

function drawLineV(
  buffer: GWU.buffer.Buffer,
  x: number,
  y: number,
  h: number,
  ch: string,
  fg: ColorBase,
  bg: ColorBase
) {
  for (let dy = 0; dy < h; ++dy) {
    buffer.draw(x, y + dy, ch, fg, bg);
  }
}
