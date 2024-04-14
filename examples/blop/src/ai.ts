import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { FOV, Game } from "./uniques";
import { Pos, PosManager } from "gw-ecs/common";
import {
  Actor,
  Attack,
  BLOP_ASPECT,
  Blop,
  Hero,
  Move,
  TravelTo,
  Wait,
  addAction,
} from "./comps";
import * as XY from "gw-utils/xy";
import { Random, random } from "gw-utils/rng";
import {
  BLOP_RANDOM_MOVE_CHANCE,
  BLOP_WANDER_CHANCE,
  BLOP_WANDER_DISTANCE,
} from "./constants";
import { findEmptyFloorTileFarFrom } from "./map/utils";
import { pathFromTo, pathFromToUsingFov } from "./utils";
import { Interrupt } from "./triggers";

////////////////////////////////////////////
// AI

export function blopAi(
  world: World,
  blop: Entity,
  time: number,
  delta: number
): boolean {
  if (aiAttackHero(world, blop)) return true;
  if (aiAttackNeighbor(world, blop)) return true;
  if (aiChargeHero(world, blop)) return true;
  if (aiTravel(world, blop)) return true;
  if (aiStartWander(world, blop)) return true;
  if (aiRandomMove(world, blop)) return true;
  return aiWait(world, blop);
}

export const BLOP_AI = [
  aiAttackHero,
  aiAttackNeighbor,
  aiChargeHero,
  aiTravel,
  aiStartWander,
  aiRandomMove,
  aiWait,
];

export function aiAttackNeighbor(world: World, blop: Entity): boolean {
  // [X] Next to Dummy, attack Dummy
  const myPos = blop.fetch(Pos)!;
  const myBlop = blop.fetch(Blop)!;
  const posMgr = world.getUnique(PosManager);

  const targets = XY.DIRS4.map(([dx, dy]) => {
    const x = myPos.x + dx;
    const y = myPos.y + dy;

    const entity = posMgr.firstAt(x, y, BLOP_ASPECT);
    if (!entity) return undefined;
    const blop = entity.fetch(Blop)!;
    return blop.team !== myBlop.team ? entity : undefined;
  }).filter((e) => e !== undefined);

  if (targets.length === 0) return false;

  const rng = world.getUnique(Random) || random;
  const target = rng.item(targets)!;
  addAction(blop, new Attack(target));
  return true;
}

export function aiAttackHero(world: World, blop: Entity): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;
  if (!hero || !hero.isAlive()) return false;

  // [X] Next to Hero - Attack Hero
  const myPos = blop.fetch(Pos)!;
  const heroPos = hero.fetch(Pos)!;
  if (XY.distanceFromTo(myPos, heroPos) == 1) {
    // TODO - Move to attack?
    world.emitTrigger(new Interrupt(blop)); // [X] Clear Travel goal
    addAction(blop, new Attack(hero));
    return true;
  }
  return false;
}

export function aiChargeHero(world: World, blop: Entity): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;
  if (!hero || !hero.isAlive()) return false;

  // [X] Next to Hero - Attack Hero
  const myPos = blop.fetch(Pos)!;
  const heroPos = hero.fetch(Pos)!;

  // [X] In FOV - Charge Hero
  const fov = world.getUnique(FOV);
  if (!fov || !fov.isDirectlyVisible(myPos.x, myPos.y)) return false;

  world.emitTrigger(new Interrupt(blop)); // [X] Clear Travel goal

  const nextSteps = pathFromTo(world, myPos, heroPos);
  console.log(
    "blop path to hero",
    myPos.xy(),
    heroPos.xy(),
    nextSteps.map((l) => `${l[0]},${l[1]}`)
  );
  if (nextSteps.length > 0) {
    const dir = XY.dirFromTo(myPos, nextSteps[0]);
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
  const nextSteps = blop.has(Hero)
    ? pathFromToUsingFov(world, myPos, travelTo.goal, blop.fetch(Blop)!.team)
    : pathFromTo(world, myPos, travelTo.goal);
  console.log(
    "blop travel path",
    myPos.xy(),
    travelTo.goal,
    nextSteps.map((l) => `${l[0]},${l[1]}`)
  );

  if (nextSteps.length > 0) {
    const dir = XY.dirFromTo(myPos, nextSteps[0]);
    addAction(blop, new Move(dir));
    if (XY.equals(nextSteps[0], travelTo.goal)) {
      // we will reach goal so lets stop wandering
      blop.remove(TravelTo);
    }
    return true;
  }

  console.log("-- no path found to travel goal --");
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
  const actor = blop.fetch(Actor)!;
  const chance = actor.getConfigOr("moveRandomly", BLOP_RANDOM_MOVE_CHANCE);
  // [X] Random Move - 20%
  if (!rng.chance(chance)) return false;

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
