import { Event, Scene } from "gw-utils/app";
import * as Constants from "../constants";
import { nextLevel } from "../map/nextLevel";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { FOV, Game } from "../uniques";
import {
  BLOP_ASPECT,
  Blop,
  EFFECT_ASPECT,
  FX_ASPECT,
  HERO_ASPECT,
  Move,
  Sprite,
  TILE_ASPECT,
  TRIGGER_ASPECT,
  Tile,
  TravelTo,
  Wait,
  addAction,
} from "../comps";
import { type Buffer } from "gw-utils/buffer";
import { Aspect, World } from "gw-ecs/world";
import { gotoNextLevel, world } from "../world";
import {
  getBlopEntityAt,
  getPickupEntityAt,
  getTileEntityAt,
} from "../map/utils";
import { DNA } from "../comps/dna";
import type { Entity } from "gw-ecs/entity";
import { Mixer, type SpriteData } from "gw-utils/sprite";
import { GameEvent } from "../queues";
import { Log } from "../uniques";
import { coloredName, pathFromToUsingFov } from "../utils";
import { FocusHelper } from "../uniques/focusHelper";
import { BLACK } from "gw-utils/color";

export const mainScene = {
  start() {
    nextLevel(world);
    const focus = world.getUniqueOr(FocusHelper, () => new FocusHelper());
    const game = world.getUniqueOr(Game, () => new Game());
    focus.reset(world, game.hero!.fetch(Pos)!);
  },
  click(ev: Event) {
    if (ev.x < Constants.MAP_WIDTH) {
      if (ev.y >= Constants.MAP_TOP && ev.y < Constants.LOG_TOP - 1) {
        const x = ev.x;
        const y = ev.y - Constants.MAP_TOP;

        const mgr = world.getUnique(PosManager);
        const entities = mgr.getAt(x, y);
        console.log("map click", x, y, entities);

        const game = world.getUnique(Game);
        game.hero!.set(new TravelTo({ x, y }));
        return;
      }
    }
    console.log("click", ev.x, ev.y);
  },
  mousemove(ev: Event) {
    const focus = world.getUnique(FocusHelper);
    const game = world.getUnique(Game);
    if (ev.x < Constants.MAP_WIDTH) {
      if (ev.y >= Constants.MAP_TOP && ev.y < Constants.LOG_TOP - 1) {
        const x = ev.x;
        const y = ev.y - Constants.MAP_TOP;
        game.changed = !focus.pos || focus.pos.x !== x || focus.pos.y !== y;
        focus.focusAt(
          { x, y },
          pathFromToUsingFov(world, game.hero!.fetch(Pos)!, {
            x,
            y,
          })
        );
        return;
      }
    }
    game.changed = !!focus.pos; // If there is a focus then we are removing it so that is a change
    focus.clearFocus();
  },
  keypress(this: Scene, ev: Event) {
    const game = world.getUnique(Game);
    const focus = world.getUnique(FocusHelper);
    const logs = world.getUnique(Log);
    if (ev.dir) {
      logs.makeLogsOld();
      focus.clearFocus();
      const hero = game.hero;
      if (hero) {
        console.log("keypress - move", ev.dir);
        addAction(hero, new Move(ev.dir));
      }
    } else if (ev.key === " ") {
      logs.makeLogsOld();
      focus.clearFocus();
      const hero = game.hero;
      if (hero) {
        console.log("keypress - wait");
        addAction(hero, new Wait());
      }
    } else if (ev.key === "Escape") {
      logs.makeLogsOld();
      focus.clearFocus();
      game.changed = true;
    } else if (ev.key === "Tab") {
      if (!focus.pos) {
        focus.focusAt(game.hero!.fetch(Pos)!);
      }
      focus.next(world);
      game.changed = true;
    } else if (ev.key === "TAB") {
      if (!focus.pos) {
        focus.focusAt(game.hero!.fetch(Pos)!);
      }
      focus.prev(world);
      game.changed = true;
    } else if (ev.key == "Backspace") {
      logs.makeLogsOld();
      gotoNextLevel(world, game.hero!);
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
      world.getUnique(Log),
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
  const focus = world.getUnique(FocusHelper);
  const fov = world.getUnique(FOV);

  mgr.everyXY((x, y, entities) => {
    if (entities.length == 0) {
      buffer.draw(x + x0, y + y0, "?", "red");
    } else {
      let entity = HERO_ASPECT.first(entities);

      // Blops have to be visible
      if (!entity && fov.isVisible(x, y)) {
        entity = BLOP_ASPECT.first(entities);
      }

      if (!entity) {
        entity =
          TRIGGER_ASPECT.first(entities) ||
          EFFECT_ASPECT.first(entities) ||
          TILE_ASPECT.first(entities)!;
      }

      let sprite: Mixer = new Mixer(entity.fetch(Sprite)!);

      const fx = FX_ASPECT.first(entities);
      if (fx) {
        sprite.drawSprite(fx.fetch(Sprite)!);
      }

      if (!fov.isVisible(x, y)) {
        if (fov.isRevealed(x, y)) {
          sprite.mix(BLACK, 50, 50);
        } else {
          sprite.mix(BLACK, 100, 100);
        }
      }

      buffer.draw(x + x0, y + y0, sprite.ch, sprite.fg, sprite.bg);
    }
  }, new Aspect(Pos, Sprite));

  if (focus.pos) {
    buffer.invert(focus.pos.x + x0, focus.pos.y + y0);
  }
  if (focus.path && focus.path.length) {
    // Avoid first and last
    for (let i = 0; i < focus.path.length - 1; ++i) {
      const loc = focus.path[i];
      buffer.highlight(loc[0] + x0, loc[1] + y0, "yellow", 50);
    }
  }
}

export function drawLog(
  buffer: Buffer,
  logs: Log,
  x0: number,
  y0: number,
  _w: number,
  h: number
) {
  for (let i = 0; i < h; ++i) {
    let y = y0 + h - i - 1;
    const log = logs.get(i);
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
  const focus = world.getUnique(FocusHelper);
  const hero = game.hero!;
  const xy = focus.pos || hero.fetch(Pos)!;
  const fov = world.getUnique(FOV);

  if (!fov.isRevealed(xy.x, xy.y)) return;

  const entity = focus.pos ? getBlopEntityAt(world, xy) : game.hero;
  if (entity) {
    drawBlopStatus(entity, buffer, x0, y0, w, h);
  }

  //
  const item = getPickupEntityAt(world, xy);
  if (item) {
    let name = coloredName(item);
    buffer.drawText(x0, y0 + h - 4, "On Ground:");
    const sprite = item.fetch(Sprite)!;
    buffer.drawSprite(x0, y0 + h - 3, sprite);
    buffer.drawText(x0 + 2, y0 + h - 3, coloredName(item));
  }

  // Show current tile
  const tile = getTileEntityAt(world, xy)!;
  buffer.drawSprite(x0, y0 + h - 1, tile.fetch(Sprite)!);
  buffer.drawText(x0, y0 + h - 1, coloredName(tile));
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
  const sprite = entity.fetch(Sprite)!;
  buffer.drawSprite(x0, y0, sprite);
  buffer.drawText(x0 + 2, y0, coloredName(entity));
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
  const dna = entity.fetch(DNA);
  if (dna) {
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
