import { Event, Scene } from "gw-utils/app";
import * as Constants from "../constants";
import { nextLevel } from "../map/nextLevel";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Game } from "../uniques";
import { coloredName, logs, makeLogsOld } from "../ui/log";
import {
  Blop,
  FX_ASPECT,
  HERO_ASPECT,
  Move,
  Sprite,
  TILE_ASPECT,
} from "../comps";
import { type Buffer } from "gw-utils/buffer";
import { Aspect, type Level } from "gw-ecs/world";
import { world } from "../world";
import { getBlopEntityAt, getTileType } from "../map/utils";
import { DNA } from "../comps/dna";
import type { Entity } from "gw-ecs/entity";
import { Mixer, type SpriteData } from "gw-utils/sprite";

export const mainScene = {
  start() {
    nextLevel(world);
  },
  click(ev: Event) {
    if (ev.x < Constants.MAP_WIDTH) {
      if (ev.y >= Constants.MAP_TOP && ev.y < Constants.LOG_TOP - 1) {
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
  mousemove(ev: Event) {
    const game = world.getUnique(Game);
    if (ev.x < Constants.MAP_WIDTH) {
      if (ev.y >= Constants.MAP_TOP && ev.y < Constants.LOG_TOP - 1) {
        const x = ev.x;
        const y = ev.y - Constants.MAP_TOP;
        game.changed = !game.focus || game.focus.x !== x || game.focus.y !== y;
        game.focus = { x, y };
        return;
      }
    }
    game.changed = !!game.focus;
    game.focus = null;
  },
  keypress(this: Scene, ev: Event) {
    const game = world.getUnique(Game);
    if (ev.dir) {
      makeLogsOld();
      game.focus = null;
      const hero = game.hero;
      if (hero) {
        console.log("keypress - move", ev.dir);
        hero.set(new Move(ev.dir));
      }
    } else if (ev.key == " ") {
      makeLogsOld();
      game.focus = null;
      nextLevel(world);
      game.changed = true;
    } else {
      console.log("key", ev.key);
    }
  },
  update(this: Scene, dt: number) {
    world.addTime(dt);
    world.runSystems();
    const game = world.getUnique(Game);
    this.needsDraw = game.changed;
    game.changed = false;
  },
  draw(buffer: Buffer) {
    buffer.blackOut();

    drawLines(buffer);

    drawMapHeader(
      buffer,
      Constants.MAP_LEFT,
      Constants.MAP_HEADER_TOP,
      Constants.MAP_WIDTH,
      1
    );
    drawMap(buffer, Constants.MAP_LEFT, Constants.MAP_TOP);
    drawLog(
      buffer,
      Constants.LOG_LEFT,
      Constants.LOG_TOP,
      Constants.LOG_WIDTH,
      Constants.LOG_HEIGHT
    );
    drawStatus(
      buffer,
      Constants.SIDEBAR_LEFT,
      Constants.SIDEBAR_TOP,
      Constants.SIDEBAR_WIDTH,
      Constants.SIDEBAR_HEIGHT
    );
  },
};

function drawMapHeader(
  buffer: Buffer,
  x0: number,
  y0: number,
  w: number,
  h: number
) {
  const game = world.getUnique(Game);
  buffer.drawText(
    x0,
    y0,
    `Depth: ${game.depth}`,
    "white",
    null,
    Constants.MAP_WIDTH,
    "center"
  );
}

function drawMap(buffer: Buffer, x0: number, y0: number) {
  const mgr = world.getUnique(PosManager);
  const game = world.getUnique(Game);
  const focus = game.focus;

  mgr.everyXY((x, y, entities) => {
    if (entities.length == 0) {
      buffer.draw(x + x0, y + y0, "?", "red");
    } else {
      const entity =
        HERO_ASPECT.first(entities) ||
        // PEDRO_ASPECT.first(entities) ||
        // BOX_ASPECT.first(entities) ||
        TILE_ASPECT.first(entities)!;

      let sprite: SpriteData = entity.fetch(Sprite)!;

      const fx = FX_ASPECT.first(entities);
      if (fx) {
        sprite = new Mixer(sprite).drawSprite(fx.fetch(Sprite)!).bake();
      }

      const isFocus = focus && focus.x == x && focus.y == y;
      if (isFocus) {
        buffer.draw(x + x0, y + y0, sprite.ch, sprite.bg, sprite.fg);
      } else {
        buffer.draw(x + x0, y + y0, sprite.ch, sprite.fg, sprite.bg);
      }
    }
  }, new Aspect(Pos, Sprite));
}

function drawLog(
  buffer: Buffer,
  x0: number,
  y0: number,
  _w: number,
  h: number
) {
  for (let i = 0; i < h; ++i) {
    let y = y0 + h - i - 1;
    const log = logs[i];
    let msg = "";

    if (log) {
      msg = log.msg;

      if (log.count > 1) {
        msg += ` (x${log.count})`;
      }
    }

    buffer.drawText(x0, y, msg);
  }
}

function drawStatus(
  buffer: Buffer,
  x0: number,
  y0: number,
  w: number,
  h: number
) {
  const game = world.getUnique(Game);
  const hero = game.hero!;
  const xy = game.focus || hero.fetch(Pos)!;

  const entity = game.focus ? getBlopEntityAt(world, xy) : game.hero;
  if (entity) {
    drawBlopStatus(entity, buffer, x0, y0, w, h);
  }

  // Show current tile
  const tile = getTileType(world, xy);
  buffer.drawText(x0, y0 + h - 1, tile.name);
}

function drawBlopStatus(
  entity: Entity,
  buffer: Buffer,
  x0: number,
  y0: number,
  w: number,
  h: number
) {
  const blop = entity.fetch(Blop)!;
  buffer.drawText(x0, y0, coloredName(entity));
  buffer.drawProgress(
    x0,
    y0 + 1,
    w,
    "green",
    "blue",
    blop.health,
    blop.maxHealth,
    `HP: ${blop.health}/${blop.maxHealth}`
  );
  buffer.drawText(x0, y0 + 2, `Power: ${blop.power}`);
  buffer.drawText(
    x0,
    y0 + 2,
    `Charge: ${blop.charge}`,
    undefined,
    undefined,
    w,
    "right"
  );

  // dna
  buffer.drawText(x0, y0 + 4, "DNA:");
  const dna = entity.fetch(DNA)!;
  for (let i = 0; i < dna.length; ++i) {
    const trigger = dna.triggers[i];
    const triggerText = trigger ? trigger.name : "...";
    const effect = dna.effects[i];
    const effectText = effect ? effect.name : "...";
    buffer.drawText(
      x0,
      y0 + 5 + i,
      `$ #{green ${triggerText}} : #{teal ${effectText}}`
    );
  }
}

function drawLines(buffer: Buffer) {
  buffer.drawLineH(
    0,
    Constants.HELP_HEIGHT + 1,
    Constants.HELP_WIDTH,
    "-",
    "white",
    "black"
  );
  buffer.drawLineV(
    Constants.MAP_WIDTH,
    Constants.HELP_HEIGHT + 2,
    Constants.MAP_HEIGHT + 2,
    "|",
    "white",
    "black"
  );
  buffer.drawLineH(
    0,
    Constants.MAP_HEADER_TOP + 1,
    Constants.MAP_WIDTH,
    "-",
    "white",
    "black"
  );
  buffer.drawLineH(
    0,
    Constants.MAP_TOP + Constants.MAP_HEIGHT,
    Constants.SCREEN_WIDTH,
    "-",
    "white",
    "black"
  );
}
