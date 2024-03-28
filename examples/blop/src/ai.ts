import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { FOV, Game } from "./uniques";
import { Pos, PosManager } from "gw-ecs/common";
import {
  Attack,
  Move,
  TILE_ASPECT,
  Tile,
  TravelTo,
  Wait,
  addAction,
} from "./comps";
import * as XY from "gw-utils/xy";
import { MoveCost, fromTo } from "gw-utils/path";
import { Random, random } from "gw-utils/rng";
import {
  BLOP_RANDOM_MOVE_CHANCE,
  BLOP_WANDER_CHANCE,
  BLOP_WANDER_DISTANCE,
} from "./constants";
import { findEmptyFloorTileFarFrom } from "./map/utils";

////////////////////////////////////////////
// AI

export function blopAi(
  world: World,
  blop: Entity,
  time: number,
  delta: number
): boolean {
  if (aiAttackHero(world, blop)) return true;
  if (aiChargeHero(world, blop)) return true;
  if (aiTravel(world, blop)) return true;
  if (aiStartWander(world, blop)) return true;
  if (aiRandomMove(world, blop)) return true;
  return aiWait(world, blop);
}

export function aiAttackHero(world: World, blop: Entity): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;

  // [X] Next to Hero - Attack Hero
  const myPos = blop.fetch(Pos)!;
  const heroPos = hero.fetch(Pos)!;
  if (XY.distanceFromTo(myPos, heroPos) == 1) {
    blop.remove(TravelTo); // [X] Clear Travel goal

    addAction(blop, new Attack(hero));
    return true;
  }
  return false;
}

export function aiChargeHero(world: World, blop: Entity): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;

  // [X] Next to Hero - Attack Hero
  const myPos = blop.fetch(Pos)!;
  const heroPos = hero.fetch(Pos)!;

  // [X] In FOV - Charge Hero
  const fov = world.getUnique(FOV);
  const posMgr = world.getUnique(PosManager);
  if (!fov || !fov.isDirectlyVisible(myPos.x, myPos.y)) return false;

  blop.remove(TravelTo); // [X] Clear Travel goal

  const nextSteps = fromTo(
    myPos,
    heroPos,
    (x, y) => {
      // TODO - Cache this
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return MoveCost.Obstruction;
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove) return MoveCost.Blocked;
      // TODO - incorporate damage
      // TODO - understand slide - AVOID
      // TODO - different move costs for water, etc...

      // TODO - Other blops in way - AVOID (except dummy b/c swap)
      // TODO - Other Colliders?

      return MoveCost.Ok;
    },
    true
  );
  console.log(
    "blop path to hero",
    myPos.xy(),
    heroPos.xy(),
    nextSteps.map((l) => `${l[0]},${l[1]}`)
  );
  if (nextSteps.length > 2) {
    const dir = XY.dirFromTo(nextSteps[0], nextSteps[1]);
    addAction(blop, new Move(dir));
    return true;
  }

  return false;
}

export function aiTravel(world: World, blop: Entity): boolean {
  // [X] Have Travel Goal
  const travelTo = blop.fetch(TravelTo);
  if (!travelTo) return false;

  const myPos = blop.fetch(Pos)!;
  if (myPos.equals(travelTo.goal)) {
    // [X] Arrived - clear goal
    blop.remove(TravelTo);
    return false;
  }

  // [X] Take next step
  const posMgr = world.getUnique(PosManager);
  const nextSteps = fromTo(
    myPos,
    travelTo.goal,
    (x, y) => {
      // TODO - Cache this
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return MoveCost.Obstruction;
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove) return MoveCost.Blocked;
      // TODO - incorporate damage
      // TODO - understand slide - AVOID
      // TODO - different move costs for water, etc...

      // TODO - Other blops in way - AVOID (except dummy b/c swap)
      // TODO - Other Colliders?

      return MoveCost.Ok;
    },
    true
  );
  console.log(
    "blop travel path",
    myPos.xy(),
    travelTo.goal,
    nextSteps.map((l) => `${l[0]},${l[1]}`)
  );

  if (nextSteps.length > 1) {
    const dir = XY.dirFromTo(nextSteps[0], nextSteps[1]);
    addAction(blop, new Move(dir));
    if (XY.equals(nextSteps[1], travelTo.goal)) {
      // we will reach goal so lets stop wandering
      blop.remove(TravelTo);
    }
    return true;
  }

  console.log("-- no path found to wander goal --");
  blop.remove(TravelTo);
  return false;
}

export function aiStartWander(world: World, blop: Entity): boolean {
  const rng = world.getUnique(Random) || random;
  // [] Start a Wander - 20%
  if (!rng.chance(BLOP_WANDER_CHANCE)) return false;

  const myPos = blop.fetch(Pos)!;
  // [] Pick goal - random safe tile at least 10 squares away
  const loc = findEmptyFloorTileFarFrom(world, myPos, BLOP_WANDER_DISTANCE);
  if (!loc) return false;

  console.log(">>> Start wander to", loc);
  addAction(blop, new TravelTo(loc));
  return aiTravel(world, blop);
}

export function aiRandomMove(world: World, blop: Entity): boolean {
  const rng = world.getUnique(Random) || random;

  // [] Random Move - 20%
  if (!rng.chance(BLOP_RANDOM_MOVE_CHANCE)) return false;

  const dir = rng.item(XY.DIRS4);
  // [] There is no smarts in this action
  // [] Should we avoid EMBER?
  // [] Should we avoid other
  console.log("- random move", dir);
  addAction(blop, new Move(dir));
  return true;
}

export function aiWait(world: World, blop: Entity): boolean {
  // [X] Idle
  addAction(blop, new Wait());
  return true;
}
