import { Event, Scene } from "gw-utils/app";
import * as Constants from "../constants";
import { nextLevel } from "../map/nextLevel";
import { Pos, PosManager } from "gw-ecs/utils/positions";
import { Game } from "../uniques";
import { logs, makeLogsOld } from "../ui/log";
import { HERO_ASPECT, Move, Sprite, TILE_ASPECT } from "../comps";
import { type Buffer } from "gw-utils/buffer";
import { Aspect, type Level } from "gw-ecs/world";
import type { ColorBase } from "gw-utils/color";
import { world } from "../world";

export const mainScene = {
  start() {
    nextLevel(world);
  },
  click(ev: Event) {
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
  keypress(this: Scene, ev: Event) {
    const game = world.getUnique(Game);
    if (ev.dir) {
      makeLogsOld();
      const hero = game.hero;
      if (hero) {
        console.log("keypress - move", ev.dir);
        hero.set(new Move(ev.dir));
      }
    } else if (ev.key == " ") {
      makeLogsOld();
      nextLevel(world);
      game.changed = true;
    } else {
      console.log("key", ev.key);
    }
  },
  update(this: Scene, dt: number) {
    world.runSystems(dt);
    const game = world.getUnique(Game);
    this.needsDraw = game.changed;
    game.changed = false;
  },
  draw(buffer: Buffer) {
    drawLineH(buffer, 0, 5, 50, "-", "white", "black");
    drawLineV(buffer, 20, 6, 22, "|", "white", "black");
    drawLineH(buffer, 0, 7, 20, "-", "white", "black");
    drawLineH(buffer, 0, 28, 50, "-", "white", "black");

    drawMap(buffer, world, 0, 8);
    drawLog(buffer, 0, 29);
    // drawStatus(buffer, 22, 6);
  },
};

function drawMap(buffer: Buffer, level: Level, x0: number, y0: number) {
  const mgr = level.getUnique(PosManager);

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

function drawLog(buffer: Buffer, x0: number, y0: number) {
  for (let i = 0; i < Constants.LOG_HEIGHT; ++i) {
    let y = Constants.LOG_TOP + Constants.LOG_HEIGHT - i - 1;
    const log = logs[i];
    let msg = "";

    if (log) {
      msg = log.msg;

      if (log.count > 1) {
        msg += ` (x${log.count})`;
      }
    }

    buffer.drawText(Constants.LOG_LEFT, y, msg);
  }
}

function drawLineH(
  buffer: Buffer,
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
  buffer: Buffer,
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
