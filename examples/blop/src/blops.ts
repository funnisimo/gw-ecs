import type { Bundle, Entity } from "gw-ecs/entity";
import { blopBundle } from "./comps/blop";
import type { World } from "gw-ecs/world";
import { Game } from "./uniques";
import { Pos } from "gw-ecs/common";
import { distanceFromTo } from "gw-utils/xy";
import { Attack, Wait, addAction } from "./comps";

////////////////////////////////////////////
// TYPES

// TODO - Remove this
export const BLOP_TYPE: Record<string, string> = {
  HERO: "HERO",
  MINI: "MINI",
  SMALL: "SMALL",
  FAT: "FAT",
  WARRIOR: "WARRIOR",
  COMPLEX: "COMPLEX",
};

////////////////////////////////////////////
// AI

export function blopAi(
  world: World,
  blop: Entity,
  time: number,
  delta: number
): boolean {
  const game = world.getUnique(Game);
  const hero = game.hero!;

  // [] Next to Hero - Attack Hero
  const myPos = blop.fetch(Pos)!;
  const heroPos = hero.fetch(Pos)!;
  if (distanceFromTo(myPos, heroPos) == 1) {
    addAction(blop, new Attack(hero));
    return true;
  }
  // [] In FOV - Charge Hero
  // [] Have Wander Goal - head there
  // [] Start a Wander - 20%
  // [] Random Move - 20%
  // [] Idle

  addAction(blop, new Wait());
  return true; // At worst case we are just idle
}

////////////////////////////////////////////
// BUNDLES

export const MINI_BLOP_BUNDLE = blopBundle(BLOP_TYPE.MINI, {
  name: "Mini Blop",
  health: 2,
  power: 1,
  ch: "b",
  fg: "brown",
  ai: [blopAi],
});

export const SMALL_BLOP_BUNDLE = blopBundle(BLOP_TYPE.SMALL, {
  name: "Small Blop",
  health: 4,
  power: 2,
  ch: "b",
  fg: "orange",
  ai: [blopAi],
});

export const FAT_BLOP_BUNDLE = blopBundle(BLOP_TYPE.FAT, {
  name: "Fat Blop",
  health: 12,
  power: 1,
  ch: "F",
  fg: "pink",
  ai: [blopAi],
});

export const WARRIOR_BLOP_BUNDLE = blopBundle(BLOP_TYPE.WARRIOR, {
  name: "Warrior Blop",
  health: 8,
  power: 4,
  ch: "W",
  fg: "red",
  ai: [blopAi],
});

export const COMPLEX_BLOP_BUNDLE = blopBundle(BLOP_TYPE.COMPLEX, {
  name: "Complex Blop",
  health: 5,
  power: 2,
  ch: "C",
  fg: "yellow",
  // TODO - assign more dna entries
  ai: [blopAi],
});

// TODO - BLOP_DUMMY
// TODO - HERO_DUMMY
// TODO - HERO_MINI

export const BLOP_BUNDLES = [
  MINI_BLOP_BUNDLE,
  SMALL_BLOP_BUNDLE,
  FAT_BLOP_BUNDLE,
  WARRIOR_BLOP_BUNDLE,
  COMPLEX_BLOP_BUNDLE,
];

////////////////////////////////////////////
// SPAWN_TABLE

export interface SpawnInfo {
  bundle: Bundle;
  average: number;
  deviation: number;
  weight: number;
}

export const SPAWN_TABLE: SpawnInfo[] = [
  {
    bundle: SMALL_BLOP_BUNDLE,
    average: 1,
    deviation: 5,
    weight: 5,
  },
  {
    bundle: FAT_BLOP_BUNDLE,
    average: 6,
    deviation: 2,
    weight: 3,
  },
  {
    bundle: WARRIOR_BLOP_BUNDLE,
    average: 8,
    deviation: 2,
    weight: 3,
  },
  {
    bundle: COMPLEX_BLOP_BUNDLE,
    average: 10,
    deviation: 1,
    weight: 3,
  },
];
