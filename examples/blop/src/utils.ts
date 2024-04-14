import type { Entity } from "gw-ecs/entity";
import {
  BLOP_ASPECT,
  Blop,
  EntityInfo,
  Sprite,
  TILE_ASPECT,
  Tile,
  TravelTo,
} from "./comps";
import { clamp } from "gw-utils/utils";
import type { Loc, XY } from "gw-utils";
import type { World } from "gw-ecs/world";
import { MoveCost, fromTo } from "gw-utils/path";
import { Pos, PosManager } from "gw-ecs/common";
import { FOV, Game } from "./uniques";
import { dirBetween } from "gw-utils/xy";

const SQRT_2_PI = Math.sqrt(2 * Math.PI);
// https://www.math.net/gaussian-distribution
export function gaussian(mu: number, stddev: number, x: number): number {
  return (
    (1 / (stddev * SQRT_2_PI)) *
    Math.exp(-Math.pow(x - mu, 2) / (2 * stddev * stddev))
  );
}

export function quadInOut(input: number): number {
  input = clamp(input, 0, 1) * 2;

  if (input < 1) {
    return (input * input) / 2;
  } else {
    input -= 1;
    return -0.5 * ((input - 2) * input - 1);
  }
}

export function cubicOut(input: number): number {
  input -= 1;
  return input * input * input + 1;
}

export function pathFromTo(world: World, fromPos: XY, toPos: XY): Loc[] {
  const posMgr = world.getUnique(PosManager);

  const path = fromTo(
    fromPos,
    toPos,
    (x, y) => {
      if (!posMgr.hasXY(x, y)) return MoveCost.Obstruction;

      // TODO - Cache tile travel info
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return MoveCost.Obstruction;
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove) return MoveCost.Blocked;

      // [x] Other blops in way - AVOID
      // TODO - (except dummy b/c swap)
      if (posMgr.firstAt(x, y, BLOP_ASPECT)) {
        return MoveCost.Avoided;
      }

      // TODO - different move costs for water, etc...
      // - understand slide - AVOID
      // - understand hurt - AVOID

      return MoveCost.Ok;
    },
    true
  );
  // remove starting loc
  path.shift();
  return path;
}

export function pathFromToUsingFov(
  world: World,
  fromPos: XY,
  toPos: XY,
  team?: string
): Loc[] {
  const posMgr = world.getUnique(PosManager);
  const fov = world.getUnique(FOV);

  const path = fromTo(
    fromPos,
    toPos,
    (x, y) => {
      if (!posMgr.hasXY(x, y)) return MoveCost.Obstruction;
      if (!fov.isRevealed(x, y)) return MoveCost.Ok; // Assume you can go there

      // TODO - Cache tile travel info
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return MoveCost.Obstruction;
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove) return MoveCost.Blocked;

      // [x] Other blops in way - Blocked
      // TODO - (except dummy b/c swap)
      const entity = posMgr.firstAt(x, y, BLOP_ASPECT);
      if (entity) {
        const blop = entity.fetch(Blop)!;
        if (!blop || !team || blop.team != team) {
          return MoveCost.Blocked;
        }
        return 2; // Swap
      }

      // TODO - different move costs for water, etc...
      // - understand slide - AVOID
      // - understand hurt - AVOID

      return MoveCost.Ok;
    },
    true
  );

  path.shift(); // remove starting spot
  return path;
}

export function heroPathTo(world: World, pos: XY): Loc[] {
  const game = world.getUnique(Game);
  const hero = game.hero!;
  if (!hero || !hero.isAlive()) return [];

  const heroPos = hero.fetch(Pos)!;
  const heroBlop = hero.fetch(Blop)!;
  return pathFromToUsingFov(world, heroPos, pos, heroBlop.team);
}

// // TODO - Facing dir must be on Actor
// export function facingDir(pos: Pos): Loc {
//   // NOTE - If you teleport, you will be facing a random direction (seems fair)
//   return dirBetween(pos.lastX, pos.lastY, pos.x, pos.y);
// }
