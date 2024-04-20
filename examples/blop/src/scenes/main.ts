import { Event, Scene } from "gw-utils/app";
import * as Constants from "../constants";
import { nextLevel, startNewGame } from "../map/nextLevel";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { FOV, Game } from "../uniques";
import {
  BLOP_ASPECT,
  Blop,
  FX_ASPECT,
  HERO_ASPECT,
  Move,
  PICKUP_ASPECT,
  PickupItem,
  Sprite,
  TILE_ASPECT,
  Tile,
  TravelTo,
  Wait,
  addAction,
  coloredName,
} from "../comps";
import { type Buffer } from "gw-utils/buffer";
import { gotoNextLevel, world } from "../world";
import {
  findClosestTileMatching,
  getBlopEntityAt,
  getPickupEntityAt,
  getTileEntityAt,
} from "../map/utils";
import { DNA } from "../comps/dna";
import { Aspect, Entity } from "gw-ecs/entity";
import { Mixer } from "gw-utils/sprite";
import { Log } from "../uniques";
import { heroPathTo } from "../utils";
import { UiHelper } from "../uniques/uiHelper";
import { BLACK } from "gw-utils/color";
import { Interrupt } from "../triggers";
import { STAIRS_ASPECT } from "../tiles";
import type { Bounds } from "gw-utils/xy";

export const mainScene = {
  start() {
    const focus = world.getUniqueOr(UiHelper, () => new UiHelper());
    const game = world.getUniqueOr(Game, () => new Game());

    world.getUnique(Log).add("Welcome to #{teal Bloplike}");
    world.getUnique(Log).add("Can you find the #{pink Blopulet}?");
    world.getUnique(Log).add("Press '?' for help.");

    startNewGame(world);
    // focus.reset(world, game.hero!.fetch(Pos)!);
  },
  click(this: Scene, ev: Event) {
    if (Constants.MAP_BOUNDS.contains(ev)) {
      const { x, y } = Constants.MAP_BOUNDS.getInternalXY(ev);

      const mgr = world.getUnique(PosManager);
      const entities = mgr.getAt(x, y);
      console.log("map click", x, y, entities);

      const game = world.getUnique(Game);
      const hero = game.hero;
      if (hero && hero.isAlive() && !game.over) {
        hero.set(new TravelTo({ x, y }));
      }
      return;
    } else if (Constants.LOG_BOUNDS.contains(ev)) {
      this.app.show("archive");
      return;
    }
    console.log("click", ev.x, ev.y);
  },
  mousemove(ev: Event) {
    const focus = world.getUnique(UiHelper);
    const game = world.getUnique(Game);
    const hero = game.hero;

    if (Constants.MAP_BOUNDS.contains(ev)) {
      const { x, y } = Constants.MAP_BOUNDS.getInternalXY(ev);
      game.changed = !focus.pos || focus.pos.x !== x || focus.pos.y !== y;
      focus.focusAt({ x, y }, heroPathTo(world, { x, y }));
      return;
    }
    game.changed = !!focus.pos; // If there is a focus then we are removing it so that is a change
    focus.clearFocus();
  },
  keypress(this: Scene, ev: Event) {
    const game = world.getUnique(Game);
    const focus = world.getUnique(UiHelper);
    const logs = world.getUnique(Log);
    if (game.over) {
      if (ev.key == "Enter") {
        game.depth = 0;
        startNewGame(world);
      } else if (ev.key === "Tab") {
        focus.next(world);
        game.changed = true;
      } else if (ev.key === "TAB") {
        focus.prev(world);
        game.changed = true;
      }
      return;
    }
    if (ev.key === "?") {
      this.app.show("help");
    } else if (ev.key == "l") {
      this.app.show("archive");
    } else if (ev.dir) {
      logs.makeLogsOld();
      focus.clearFocus();
      const hero = game.hero;
      if (hero) {
        console.log("keypress - move", ev.dir);
        addAction(hero, new Move(ev.dir));
      }
    } else if (ev.key === "g") {
      // Try pickup item
      logs.makeLogsOld();
      focus.clearFocus();
      const hero = game.hero;
      if (hero) {
        console.log("keypress - pickup");
        addAction(hero, new PickupItem());
      }
    } else if (ev.key === ">") {
      // If on top of stairs - take stairs
      const posMgr = world.getUnique(PosManager);
      const hero = game.hero!;
      const heroPos = hero.fetch(Pos)!;
      if (posMgr.hasAt(heroPos.x, heroPos.y, STAIRS_ASPECT)) {
        // TODO - addAction(hero, new Climb());
        nextLevel(world);
      } else {
        const e = findClosestTileMatching(
          world,
          heroPos,
          (e) => e.fetch(Tile)!.stairs
        );
        if (e) {
          const pos = e.fetch(Pos)!;
          focus.focusAt(pos, heroPathTo(world, pos));
          game.changed = true;
        }
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
      world.emitTrigger(new Interrupt(game.hero!));
      game.changed = true;
    } else if (ev.key == "Enter") {
      if (focus.pos) {
        // TODO - addAction(hero, new TravelTo(focus.pos));
        game.hero!.set(new TravelTo(focus.pos));
      }
    } else if (ev.key === "Tab") {
      if (!focus.pos) {
        focus.focusAt(game.hero!.fetch(Pos)!);
      }
      const e = focus.next(world);
      if (e) {
        focus.setPath(heroPathTo(world, e.fetch(Pos)!));
      }
      game.changed = true;
    } else if (ev.key === "TAB") {
      if (!focus.pos) {
        focus.focusAt(game.hero!.fetch(Pos)!);
      }
      const e = focus.prev(world);
      if (e) {
        focus.setPath(heroPathTo(world, e.fetch(Pos)!));
      }
      game.changed = true;
    } else if (ev.key == "Backspace") {
      logs.makeLogsOld();
      nextLevel(world);
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

    drawHelp(buffer, Constants.HELP_HEIGHT);

    drawMapHeader(buffer, 0, Constants.MAP_HEADER_TOP);
    drawMap(buffer, Constants.MAP_BOUNDS);
    drawLog(buffer, Constants.LOG_BOUNDS);
    drawStatus(buffer, Constants.SIDEBAR_BOUNDS);
  },
};

export function drawHelp(buffer: Buffer, h: number) {
  const game = world.getUnique(Game);
  buffer.drawText(0, 0, "#{teal Bloplike 7DRL} - originally by Drestin");
}

export function drawMapHeader(buffer: Buffer, x: number, y: number) {
  const game = world.getUnique(Game);
  buffer.drawText(
    x,
    y,
    `Depth: ${game.depth}`,
    "white",
    null,
    Constants.MAP_WIDTH,
    "center"
  );
}

export function drawMap(buffer: Buffer, bounds: Bounds) {
  const mgr = world.getUnique(PosManager);
  const game = world.getUnique(Game);
  const focus = world.getUnique(UiHelper);
  const fov = world.getUnique(FOV);

  mgr.everyXY((x, y, entities) => {
    if (entities.length == 0) {
      buffer.draw(x + bounds.x, y + bounds.y, "?", "red");
    } else {
      // TODO - Charge effect
      let entity = HERO_ASPECT.first(entities);

      // Blops have to be visible
      if (!entity && fov.isVisible(x, y)) {
        entity = BLOP_ASPECT.first(entities);
      }

      if (!entity) {
        entity = PICKUP_ASPECT.first(entities) || TILE_ASPECT.first(entities)!;
      }

      let sprite: Mixer = new Mixer(entity.fetch(Sprite)!);

      if (fov.isVisible(x, y)) {
        const blop = entity.fetch(Blop);
        if (blop && blop.charge > 0) {
          sprite.mix("teal", 0, blop.charge * 10);
        }
        const fx = FX_ASPECT.first(entities);
        if (fx) {
          sprite.drawSprite(fx.fetch(Sprite)!);
        }
      } else if (fov.isRevealed(x, y)) {
        sprite.mix(BLACK, 50, 50);
      } else {
        sprite.blackOut();
      }

      buffer.draw(x + bounds.x, y + bounds.y, sprite.ch, sprite.fg, sprite.bg);
    }
  }, new Aspect(Pos, Sprite));

  if (focus.pos) {
    buffer.invert(focus.pos.x + bounds.x, focus.pos.y + bounds.y);
  }
  if (focus.path && focus.path.length) {
    // Avoid first and last
    for (let i = 0; i < focus.path.length - 1; ++i) {
      const loc = focus.path[i];
      buffer.highlight(loc[0] + bounds.x, loc[1] + bounds.y, "yellow", 50);
    }
  }
}

export function drawLog(buffer: Buffer, bounds: Bounds, height?: number) {
  const h = height || Constants.LOG_BOUNDS.height;
  const w = Constants.LOG_BOUNDS.width;

  const x0 = Constants.LOG_BOUNDS.left;
  const y0 = Constants.LOG_BOUNDS.bottom - h;

  const logs = world.getUnique(Log);

  buffer.blackOutRect(x0, y0, w, h);

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

export function drawStatus(buffer: Buffer, bounds: Bounds) {
  const x0 = Constants.SIDEBAR_BOUNDS.left;
  const y0 = Constants.SIDEBAR_BOUNDS.top;
  const w = Constants.SIDEBAR_BOUNDS.width;
  const h = Constants.SIDEBAR_BOUNDS.height;

  const game = world.getUnique(Game);
  const focus = world.getUnique(UiHelper);
  const hero = game.hero!;
  let xy = focus.pos;
  if (!xy) {
    if (hero && hero.isAlive()) {
      xy = hero.fetch(Pos)!;
    }
  }
  if (!xy) return;

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
    if (dna.length == 0) {
      buffer.drawText(x0, y0 + 5, "  #{green None}");
    }
    for (let i = 0; i < dna.length; ++i) {
      const trigger = dna.getTrigger(i);
      const triggerText = trigger ? trigger.name : "...";
      const effect = dna.getEffect(i);
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
    Constants.HELP_HEIGHT, // after help
    Constants.HELP_WIDTH,
    "-",
    "white",
    "black"
  );
  buffer.drawLineV(
    Constants.MAP_WIDTH,
    Constants.HELP_HEIGHT + 1,
    Constants.MAP_HEIGHT + 2,
    "|",
    "white",
    "black"
  );
  buffer.drawLineH(
    0,
    Constants.MAP_HEADER_TOP + 1, // after map header
    Constants.MAP_WIDTH,
    "-",
    "white",
    "black"
  );
  buffer.drawLineH(
    0,
    Constants.MAP_BOUNDS.bottom, // after map
    Constants.SCREEN_WIDTH,
    "-",
    "white",
    "black"
  );
}
