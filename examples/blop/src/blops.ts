import type { Bundle } from "gw-ecs/entity";
import { blopBundle } from "./comps/blop";

////////////////////////////////////////////
// TYPES

export const BLOP_TYPE: Record<string, string> = {
  MINI: "MINI",
  SMALL: "SMALL",
  FAT: "FAT",
  WARRIOR: "WARRIOR",
  COMPLEX: "COMPLEX",
};

////////////////////////////////////////////
// BUNDLES

export const MINI_BLOP_BUNDLE = blopBundle(BLOP_TYPE.MINI, {
  name: "Mini Blop",
  health: 2,
  power: 1,
  ch: "b",
  fg: "brown",
});

export const SMALL_BLOP_BUNDLE = blopBundle(BLOP_TYPE.SMALL, {
  name: "Small Blop",
  health: 4,
  power: 2,
  ch: "b",
  fg: "orange",
});

export const FAT_BLOP_BUNDLE = blopBundle(BLOP_TYPE.FAT, {
  name: "Fat Blop",
  health: 12,
  power: 1,
  ch: "F",
  fg: "pink",
});

export const WARRIOR_BLOP_BUNDLE = blopBundle(BLOP_TYPE.WARRIOR, {
  name: "Warrior Blop",
  health: 8,
  power: 4,
  ch: "W",
  fg: "red",
});

export const COMPLEX_BLOP_BUNDLE = blopBundle(BLOP_TYPE.COMPLEX, {
  name: "Complex Blop",
  health: 5,
  power: 2,
  ch: "C",
  fg: "yellow",
  // TODO - assign more dna entries
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
