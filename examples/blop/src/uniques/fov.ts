import { Shadowcast, FovFlags } from "gw-utils/fov";
import * as Grid from "gw-utils/grid";
import type { World } from "gw-ecs/world";
import { Tile } from "../comps";
import { Pos } from "gw-ecs/common";

export { FovFlags };

export function notifyFovWhenTilesChange(fov: FOV, world: World) {
  const tileMgr = world.getStore(Tile);
  tileMgr.notify({
    compSet: (entity, comp) => {
      const pos = entity.fetch(Pos);
      if (pos) {
        fov.setBlocksVisibility(pos.x, pos.y, comp.blocksVision);
      }
    },
    compRemoved: (entity, comp) => {
      const pos = entity.fetch(Pos);
      if (pos) {
        fov.setBlocksVisibility(pos.x, pos.y, true);
      }
    },
  });
}

/**
 * Tracks each cell in the grid.
 */
export enum CellStatus {
  BLOCKS_VISIBILITY = 1,
  HAS_LIGHT = 2,
}

export class FOV {
  flags: Grid.NumGrid;
  cellStatus: Grid.NumGrid;
  calc: Shadowcast;

  constructor(width: number, height: number) {
    this.flags = Grid.alloc(width, height, 0);
    this.cellStatus = Grid.alloc(width, height, CellStatus.HAS_LIGHT);

    this.calc = new Shadowcast({
      hasXY: (x, y) => this.flags.hasXY(x, y),
      isBlocked: (x, y) => this.blocksVisibility(x, y),
    });
  }

  //   /////////////////////////////////
  //   // WORLD INIT

  //   worldInit(world: World): void {
  //     // TODO - This should be in the world setup
  //     notifyFovWhenTilesChange(this, world);
  //   }

  /////////////////////////////////
  // CELL STATUS

  resetCellStatus() {
    this.cellStatus.fill(0);
  }

  blocksVisibility(x: number, y: number): boolean {
    return (this.cellStatus.get(x, y)! & CellStatus.BLOCKS_VISIBILITY) > 0;
  }
  clearBlocksVisibility() {
    this.cellStatus.update((v) => v & ~CellStatus.BLOCKS_VISIBILITY);
  }
  setBlocksVisibility(x: number, y: number, blocks = true) {
    if (blocks) {
      this.cellStatus.update(x, y, (v) => v | CellStatus.BLOCKS_VISIBILITY);
    } else {
      this.cellStatus.update(x, y, (v) => v & ~CellStatus.BLOCKS_VISIBILITY);
    }
  }

  hasVisibleLight(x: number, y: number): boolean {
    return (this.cellStatus.get(x, y)! & CellStatus.HAS_LIGHT) > 0;
  }
  setHasVisibleLight(x: number, y: number, blocks = true) {
    if (blocks) {
      this.cellStatus.update(x, y, (v) => v | CellStatus.HAS_LIGHT);
    } else {
      this.cellStatus.update(x, y, (v) => v & ~CellStatus.HAS_LIGHT);
    }
  }
  clearHasVisibleLight() {
    this.cellStatus.update((v) => v & ~CellStatus.HAS_LIGHT);
  }

  /////////////////////////////////
  // FLAGS

  setFlags(x: number, y: number, flags: number) {
    this.flags._data[x][y] |= flags;
  }
  getFlag(x: number, y: number): number {
    return this.flags.get(x, y) || 0;
  }

  isVisible(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.VISIBLE);
  }
  isAnyKindOfVisible(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.ANY_KIND_OF_VISIBLE);
  }
  isClairvoyantVisible(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.CLAIRVOYANT_VISIBLE);
  }
  isTelepathicVisible(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.TELEPATHIC_VISIBLE);
  }
  isInFov(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.IN_FOV);
  }
  isDirectlyVisible(x: number, y: number): boolean {
    const flags = FovFlags.VISIBLE | FovFlags.IN_FOV;
    return (this.getFlag(x, y) & flags) === flags;
  }
  isActorDetected(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.ACTOR_DETECTED);
  }
  isItemDetected(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.ITEM_DETECTED);
  }
  isMagicMapped(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.MAGIC_MAPPED);
  }
  isRevealed(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.REVEALED);
  }
  fovChanged(x: number, y: number): boolean {
    const flags = this.flags.get(x, y) || 0;
    const isVisible = !!(flags & FovFlags.ANY_KIND_OF_VISIBLE);
    const wasVisible = !!(flags & FovFlags.WAS_ANY_KIND_OF_VISIBLE);
    return isVisible !== wasVisible;
  }
  wasAnyKindOfVisible(x: number, y: number): boolean {
    return !!(this.getFlag(x, y) & FovFlags.WAS_ANY_KIND_OF_VISIBLE);
  }

  ////////////////////////////////
  // ADJUSTMENTS

  makeAlwaysVisible() {
    // this.changed = true;
    this.flags.forEach((_v, x, y) => {
      this.flags._data[x][y] |=
        FovFlags.ALWAYS_VISIBLE | FovFlags.REVEALED | FovFlags.VISIBLE;
      //   this.callback(x, y, true);
    });
  }
  makeCellAlwaysVisible(x: number, y: number) {
    // this.changed = true;
    this.flags._data[x][y] |=
      FovFlags.ALWAYS_VISIBLE | FovFlags.REVEALED | FovFlags.VISIBLE;
    // this.callback(x, y, true);
  }

  revealAll(makeVisibleToo = true): void {
    const flag = FovFlags.REVEALED | (makeVisibleToo ? FovFlags.VISIBLE : 0);
    this.flags.update((v) => v | flag);
    // this.flags.forEach((v, x, y) => {
    //   this.callback(x, y, !!(v & FovFlags.VISIBLE));
    // });
    // this.changed = true;
  }
  revealCell(x: number, y: number, radius = 0, makeVisibleToo = true) {
    const flag = FovFlags.REVEALED | (makeVisibleToo ? FovFlags.VISIBLE : 0);

    this.calc.calculate(x, y, radius, (x0, y0) => {
      this.flags._data[x0][y0] |= flag;
      //   this.callback(x0, y0, !!(flag & FovFlags.VISIBLE));
    });
    // this.changed = true;
  }
  hideCell(x: number, y: number): void {
    this.flags._data[x][y] &= ~(
      FovFlags.MAGIC_MAPPED |
      FovFlags.REVEALED |
      FovFlags.ALWAYS_VISIBLE
    );
    this.flags._data[x][y] = demoteCellVisibility(this.flags._data[x][y]); // clears visible, etc...
    // this.callback(x, y, false);

    // this.changed = true;
  }
  magicMapCell(x: number, y: number): void {
    this.flags._data[x][y] |= FovFlags.MAGIC_MAPPED;
    // this.changed = true;
    // this.callback(x, y, true);
  }
  reset() {
    this.flags.fill(0);

    // TODO - REMOVE :: This is for testing AI only
    this.makeAlwaysVisible();

    // this.changed = true;
    // this.flags.forEach((_v, x, y) => {
    //   this.callback(x, y, false);
    // });
  }
}

/**
 * Should only be used by FovSystem.
 * clears all WAS_XXX and demotes all flags from IN_XXX to WAS_IN_XXX
 * @param flag - the cell flag to demote
 * @returns - the new value after the demotion
 */
export function demoteCellVisibility(flag: number): number {
  flag &= ~(
    FovFlags.WAS_ANY_KIND_OF_VISIBLE |
    FovFlags.WAS_IN_FOV |
    FovFlags.WAS_DETECTED
  );

  if (flag & FovFlags.IN_FOV) {
    flag &= ~FovFlags.IN_FOV;
    flag |= FovFlags.WAS_IN_FOV;
  }
  if (flag & FovFlags.VISIBLE) {
    flag &= ~FovFlags.VISIBLE;
    flag |= FovFlags.WAS_VISIBLE;
  }
  if (flag & FovFlags.CLAIRVOYANT_VISIBLE) {
    flag &= ~FovFlags.CLAIRVOYANT_VISIBLE;
    flag |= FovFlags.WAS_CLAIRVOYANT_VISIBLE;
  }
  if (flag & FovFlags.TELEPATHIC_VISIBLE) {
    flag &= ~FovFlags.TELEPATHIC_VISIBLE;
    flag |= FovFlags.WAS_TELEPATHIC_VISIBLE;
  }
  if (flag & FovFlags.ALWAYS_VISIBLE) {
    flag |= FovFlags.VISIBLE;
  }
  if (flag & FovFlags.ITEM_DETECTED) {
    flag &= ~FovFlags.ITEM_DETECTED;
    flag |= FovFlags.WAS_ITEM_DETECTED;
  }
  if (flag & FovFlags.ACTOR_DETECTED) {
    flag &= ~FovFlags.ACTOR_DETECTED;
    flag |= FovFlags.WAS_ACTOR_DETECTED;
  }

  return flag;
}
