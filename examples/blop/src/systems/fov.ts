import { type RunIfFn, EntitySystem } from "gw-ecs/system";
import { type World } from "gw-ecs/world";
import { FOV, FovFlags, Game, Log, demoteCellVisibility } from "../uniques";
import { Pos, PosManager } from "gw-ecs/common";
import { distanceFromTo } from "gw-utils/xy";
import {
  AppearSprite,
  ENTITY_INFO_ASPECT,
  EntityInfo,
  Hero,
  TILE_ASPECT,
  Tile,
} from "../comps";
import { Aspect, Entity } from "gw-ecs/entity";
import { coloredName } from "../comps";
import { flash } from "../fx/flash";
import { Interrupt } from "../triggers";

export function heroMoved(
  world: World,
  time: number,
  delta: number,
  lastTick: number
): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;
  return hero.isUpdatedSince(Pos, lastTick);
}

export function heroTeleported(
  world: World,
  time: number,
  delta: number,
  lastTick: number
): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;
  if (!hero.isUpdatedSince(Pos, lastTick)) return false;
  const pos = hero.fetch(Pos)!;
  return distanceFromTo(pos, pos.lastXY()) > 1;
}

export class FovSystem extends EntitySystem {
  constructor(runIf?: RunIfFn) {
    super(new Aspect(Hero).updated(Pos), runIf);
  }

  start(world: World): void {
    // TODO - ensureUnique
    world.getUniqueOr(FOV, () => {
      throw new Error("FOV unique is missing.");
    });
  }

  runEntity(world: World, hero: Entity, time: number, delta: number): void {
    calculateFov(world, hero);
  }
}

export function updateVisibility(world: World) {
  const fov = world.getUnique(FOV);
  const posMgr = world.getUnique(PosManager);
  posMgr.everyXY((x, y, entities) => {
    const blocksVisibility = entities[0].fetch(Tile)!.blocksVision;
    fov.setBlocksVisibility(x, y, blocksVisibility);
  }, TILE_ASPECT);
}

export function calculateFov(world: World, hero: Entity, flashNew = true) {
  const fov = world.getUnique(FOV);
  const heroPos = hero.fetch(Pos)!;
  const radius = 99;

  console.log("==== CALC FOV ====");

  fov.flags.update(demoteCellVisibility);

  // TODO - iterate all entities with FovSource component
  fov.calc.calculate(heroPos.x, heroPos.y, radius, (x, y, v) => {
    if (v) {
      fov.setFlags(x, y, FovFlags.PLAYER);
    }
  });

  // updateLighting();
  fov.flags.update(promoteCellVisibility.bind(null, fov));

  // See if something that the player is interested in comes into view
  // TODO - This should go somewhere else... another service?
  // if (hero.has(TravelTo)) {
  let needsInterrupt = false;
  const posMgr = world.getUnique(PosManager);
  for (let x = 0; x < fov.width; ++x) {
    for (let y = 0; y < fov.height; ++y) {
      if (fov.becameVisible(x, y)) {
        const entities = posMgr.getAt(x, y, ENTITY_INFO_ASPECT);
        // Are any of the entities interesting?
        if (entities.length > 0) {
          entities.forEach((e) => {
            const info = e.update(EntityInfo)!;
            if (info.shouldInterruptWhenSeen()) {
              needsInterrupt = true;
              world.getUnique(Log).add(`A ${coloredName(e)} appears.`);
              flashNew && flash(world, e.fetch(Pos)!, AppearSprite);
            }
            info.seen();
          });
        }
      }
    }
  }
  if (needsInterrupt) {
    world.emitTrigger(new Interrupt(hero));
  }
  // }
}

function promoteCellVisibility(
  fov: FOV,
  flag: number,
  x: number,
  y: number
): number {
  if (
    flag & FovFlags.IN_FOV &&
    fov.hasVisibleLight(x, y) // &&
    // !(cell.flags.cellMech & FovFlagsMech.DARKENED)
  ) {
    flag |= FovFlags.VISIBLE;
  }

  flag = updateCellVisibility(fov, flag, x, y);
  // if (this.updateCellClairyvoyance(flag, x, y)) return;
  // if (this.updateCellTelepathy(flag, x, y)) return;
  flag = updateCellDetect(fov, flag, x, y);
  // if (this.updateItemDetect(flag, x, y)) return;
  return flag;
}

function updateCellVisibility(
  fov: FOV,
  flag: number,
  x: number,
  y: number
): number {
  const isVisible = !!(flag & FovFlags.ANY_KIND_OF_VISIBLE);
  const wasVisible = !!(flag & FovFlags.WAS_ANY_KIND_OF_VISIBLE);

  if (isVisible && wasVisible) {
    // if (this.site.lightChanged(x, y)) {
    //     this.site.redrawCell(x, y);
    // }
  } else if (isVisible && !wasVisible) {
    // if the cell became visible this move
    flag |= FovFlags.REVEALED;
    // this._callback(x, y, isVisible);
    // this.changed = true;
  } else if (!isVisible && wasVisible) {
    // if the cell ceased being visible this move
    // this._callback(x, y, isVisible);
    // this.changed = true;
  }
  return flag;
}

function updateCellDetect(
  fov: FOV,
  flag: number,
  x: number,
  y: number
): number {
  const isDetect = !!(flag & FovFlags.IS_DETECTED);
  const wasDetect = !!(flag & FovFlags.WAS_DETECTED);

  if (isDetect && wasDetect) {
    // if (this.site.lightChanged(x, y)) {
    //     this.site.redrawCell(x, y);
    // }
  } else if (!isDetect && wasDetect) {
    // ceased being detected visible
    // this._callback(x, y, isDetect);
    // this.changed = true;
  } else if (!wasDetect && isDetect) {
    // became detected visible
    // this._callback(x, y, isDetect);
    // this.changed = true;
  }
  return flag;
}
