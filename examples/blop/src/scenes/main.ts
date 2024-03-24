import { Event, Scene } from "gw-utils/app";
import * as Constants from "../constants";
import { nextLevel } from "../map/nextLevel";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Game } from "../uniques";
import { coloredName, logs, makeLogsOld } from "../ui/log";
import {
  Blop,
  EFFECT_ASPECT,
  FX_ASPECT,
  HERO_ASPECT,
  Hero,
  Move,
  Sprite,
  TILE_ASPECT,
  TRIGGER_ASPECT,
  Tile,
} from "../comps";
import { type Buffer } from "gw-utils/buffer";
import { Aspect, World, type Level } from "gw-ecs/world";
import { world } from "../world";
import { getBlopEntityAt, getTileType } from "../map/utils";
import { DNA } from "../comps/dna";
import type { Entity } from "gw-ecs/entity";
import { Mixer, type SpriteData } from "gw-utils/sprite";
import { GameEvent } from "../queues";
import type { XY } from "gw-utils";
import { distanceFromTo, equals } from "gw-utils/xy";

class FocusEntities {
  entities: Entity[];
  index = 0;

  constructor(world: World) {
    this.entities = [];
    world.level.entities().forEach((e) => {
      if (e.has(Tile)) return;
      if (!e.has(Pos)) return;
      this.entities.push(e);
    });
    const game = world.getUnique(Game);
    const pos = game.focus || game.hero!.fetch(Pos)!;
    this.entities.sort(
      (a, b) =>
        distanceFromTo(a.fetch(Pos)!, pos) - distanceFromTo(b.fetch(Pos)!, pos)
    );
    this.index = equals(this.entities[0].fetch(Pos)!, pos) ? 0 : -1; // So next will get to correct spot
  }

  next(): Entity {
    this.index += 1;
    if (this.index >= this.entities.length) {
      this.index = 0;
    }
    return this.entities[this.index];
  }

  prev(): Entity {
    this.index -= 1;
    if (this.index < 0) {
      this.index = this.entities.length - 1;
    }
    return this.entities[this.index];
  }

  current(): Entity {
    return this.entities[this.index];
  }
}

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
    world.removeUnique(FocusEntities);
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
      world.removeUnique(FocusEntities);
      game.focus = null;
      const hero = game.hero;
      if (hero) {
        console.log("keypress - move", ev.dir);
        hero.set(new Move(ev.dir));
        game.ready = true;
      }
    } else if (ev.key === " ") {
      makeLogsOld();
      world.removeUnique(FocusEntities);
      game.focus = null;
      const hero = game.hero;
      if (hero) {
        console.log("keypress - wait");
        world.pushQueue(new GameEvent(hero, "wait"));
        world.pushQueue(new GameEvent(hero, "turn", { time: 0 }));
        game.ready = true;
      }
    } else if (ev.key === "Escape") {
      makeLogsOld();
      world.removeUnique(FocusEntities);
      game.focus = null;
      game.changed = true;
    } else if (ev.key === "Tab") {
      const focusEntities = world.getUniqueOr(
        FocusEntities,
        () => new FocusEntities(world)
      );
      const entity = focusEntities.next();
      game.focus = entity.fetch(Pos)!;
      game.changed = true;
    } else if (ev.key === "TAB") {
      const focusEntities = world.getUniqueOr(
        FocusEntities,
        () => new FocusEntities(world)
      );
      const entity = focusEntities.prev();
      game.focus = entity.fetch(Pos)!;
      game.changed = true;
    } else if (ev.key == "Backspace") {
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

export function drawMapHeader(
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

export function drawMap(buffer: Buffer, x0: number, y0: number) {
  const mgr = world.getUnique(PosManager);
  const game = world.getUnique(Game);
  const focus = game.focus;

  mgr.everyXY((x, y, entities) => {
    if (entities.length == 0) {
      buffer.draw(x + x0, y + y0, "?", "red");
    } else {
      const entity =
        HERO_ASPECT.first(entities) ||
        TRIGGER_ASPECT.first(entities) ||
        EFFECT_ASPECT.first(entities) ||
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

export function drawLog(
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

export function drawStatus(
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

export function drawBlopStatus(
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
      `§ #{green ${triggerText}} : #{teal ${effectText}}`
    );
  }
}

export function drawLines(buffer: Buffer) {
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
