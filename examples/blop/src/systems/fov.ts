import { System, type RunIfFn, EntitySystem } from "gw-ecs/system";
import { Aspect, type World } from "gw-ecs/world";
import { FOV, FovFlags, Game, demoteCellVisibility } from "../uniques";
import { Pos, PosManager } from "gw-ecs/common";
import { distanceFromTo } from "gw-utils/xy";
import { Hero, TILE_ASPECT, Tile } from "../comps";
import type { Entity } from "gw-ecs/entity";

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
  //   constructor(runIf?: RunIfFn) {
  //     super(runIf || heroMoved); // TODO - heroMoved should not be in this (part of setup)
  //   }

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

export function calculateFov(world: World, hero?: Entity | null) {
  if (!hero) {
    const game = world.getUnique(Game);
    hero = game.hero!;
  }

  const fov = world.getUnique(FOV);
  const heroPos = hero.fetch(Pos)!;
  const radius = 99;

  console.log("==== CALC FOV ====");

  fov.flags.update(demoteCellVisibility);

  // TODO - iterate all entities with FovSource component
  //      - FovSource = { radius: number, type: FovFlag }
  // this.site.eachViewport((x, y, radius, type) => {
  //   let flag = type & FovFlags.VIEWPORT_TYPES;
  //   if (!flag) flag = FovFlags.VISIBLE;
  //   // if (!flag)
  //   //     throw new Error('Received invalid viewport type: ' + Flag.toString(FovFlags, type));

  //   if (radius == 0) {
  //     this.flags._data[x][y] |= flag;
  //     return;
  //   }

  //   this.fov.calculate(x, y, radius, (x, y, v) => {
  //     if (v) {
  //       this.flags._data[x][y] |= flag;
  //     }
  //   });
  // });

  fov.calc.calculate(heroPos.x, heroPos.y, radius, (x, y, v) => {
    if (v) {
      fov.setFlags(x, y, FovFlags.PLAYER);
    }
  });

  // if (PLAYER.bonus.clairvoyance < 0) {
  //   discoverCell(PLAYER.xLoc, PLAYER.yLoc);
  // }
  //
  // if (PLAYER.bonus.clairvoyance != 0) {
  // 	updateClairvoyance();
  // }
  //
  // updateTelepathy();
  // updateMonsterDetection();

  // updateLighting();
  fov.flags.update(promoteCellVisibility.bind(null, fov));

  // if (PLAYER.status.hallucinating > 0) {
  // 	for (theItem of DUNGEON.items) {
  // 		if ((pmap[theItem.xLoc][theItem.yLoc].flags & DISCOVERED) && refreshDisplay) {
  // 			refreshDungeonCell(theItem.xLoc, theItem.yLoc);
  // 		}
  // 	}
  // 	for (monst of DUNGEON.monsters) {
  // 		if ((pmap[monst.xLoc][monst.yLoc].flags & DISCOVERED) && refreshDisplay) {
  // 			refreshDungeonCell(monst.xLoc, monst.yLoc);
  // 		}
  // 	}
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
