import type { Entity } from "gw-ecs/entity";
import {
  BLOP_ASPECT,
  Name,
  Sprite,
  TILE_ASPECT,
  Tile,
  TravelTo,
} from "./comps";
import { clamp } from "gw-utils/utils";
import type { Loc, XY } from "gw-utils";
import type { World } from "gw-ecs/world";
import { MoveCost, fromTo } from "gw-utils/path";
import { PosManager } from "gw-ecs/common";
import { FOV } from "./uniques";

const SQRT_2_PI = Math.sqrt(2 * Math.PI);
// https://www.math.net/gaussian-distribution
export function gaussian(mu: number, stddev: number, x: number): number {
  return (
    (1 / (stddev * SQRT_2_PI)) *
    Math.exp(-Math.pow(x - mu, 2) / (2 * stddev * stddev))
  );
}

export function coloredName(entity: Entity): string {
  let sprite = entity.fetch(Sprite) || { fg: "white" };
  let name = entity.fetch(Name);

  if (!name) return `#{${sprite.fg} Entity}`;

  // other items: powerup + heal + add dna slot + ...
  return `#{${sprite.fg} ${name.name}}`;
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
  toPos: XY
): Loc[] {
  const posMgr = world.getUnique(PosManager);
  const fov = world.getUnique(FOV);

  const path = fromTo(
    fromPos,
    toPos,
    (x, y) => {
      if (!posMgr.hasXY(x, y)) return MoveCost.Obstruction;
      if (!fov.isRevealed(x, y)) return MoveCost.Avoided;

      // TODO - Cache tile travel info
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return MoveCost.Obstruction;
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove) return MoveCost.Blocked;

      // [x] Other blops in way - Blocked
      // TODO - (except dummy b/c swap)
      if (posMgr.firstAt(x, y, BLOP_ASPECT)) {
        return MoveCost.Blocked;
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

export function interrupt(entity: Entity) {
  entity.remove(TravelTo);
}
