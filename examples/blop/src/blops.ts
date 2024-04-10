import { Bundle } from "gw-ecs/entity";
import { BLOP_AI, aiAttackNeighbor, aiRandomMove, aiWait } from "./ai";
import {
  Actor,
  DNA,
  Sprite,
  type AiFn,
  type BlopConfig,
  type SpriteConfig,
  Blop,
  EntityInfo,
} from "./comps";
import type { FlagBase } from "gw-utils/flag";
import { Collider } from "gw-ecs/common";
import type { World } from "gw-ecs/world";
import { Random, random } from "gw-utils/rng";
import { triggerClasses } from "./dnaTriggers";
import { effectClasses } from "./dnaEffects";

////////////////////////////////////////////
// TYPES

// TODO - Move this to '../blops'
export interface BlopBundleConfig extends SpriteConfig, BlopConfig {
  name: string;
  ai?: AiFn[];
  colliderTags?: string[];
  flags?: FlagBase;
  config?: Record<string, any>;
  dna?: number;
}

// TODO - Move this to '../blops'
export function blopBundle(type: string, config: BlopBundleConfig): Bundle {
  const ai = config.ai || [];
  const tags = config.colliderTags || ["actor"];
  const flags = config.flags || "ALWAYS_INTERRUPT, OBSERVE";
  const actor = new Actor(...ai);
  const aiConfig = config.config || {};
  const slots = config.dna || 0;

  const bundle = new Bundle(() => new Blop(type, config))
    .with(new Sprite(config.ch, config.fg, config.bg))
    .with(new Collider("blop", ...tags))
    // TODO - AI?
    .with(() => new Actor(...ai).withConfig(aiConfig))
    // TODO - Drops
    .with((world: World) => {
      const rng = world.getUnique(Random) || random;
      const dna = new DNA(slots);
      for (let i = 0; i < slots; ++i) {
        const triggerCls = rng.item(triggerClasses);
        const effectCls = rng.item(effectClasses);

        dna.setTrigger(i, new triggerCls());
        dna.setEffect(i, new effectCls());
      }
      if (slots == 0) {
        dna.addSlot(); // Use half slot to hold DNA to drop
        if (rng.chance(50)) {
          // add effect
          const effectCls = rng.item(effectClasses);
          dna.setEffect(0, new effectCls());
        } else {
          // -or- add trigger
          const triggerCls = rng.item(triggerClasses);
          dna.setTrigger(0, new triggerCls());
        }
      }
      return dna;
    })
    .with(new EntityInfo(config.name, flags));
  return bundle;
}

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
// BUNDLES

export const MINI_BLOP_BUNDLE = blopBundle(BLOP_TYPE.MINI, {
  name: "Mini Blop",
  health: 2,
  power: 1,
  ch: "m",
  fg: "brown",
  ai: BLOP_AI,
  dropChance: 0,
});

export const SMALL_BLOP_BUNDLE = blopBundle(BLOP_TYPE.SMALL, {
  name: "Small Blop",
  health: 4,
  power: 2,
  ch: "b",
  fg: "orange",
  ai: BLOP_AI,
});

export const FAT_BLOP_BUNDLE = blopBundle(BLOP_TYPE.FAT, {
  name: "Fat Blop",
  health: 12,
  power: 1,
  ch: "F",
  fg: "pink",
  ai: BLOP_AI,
  dna: 1,
});

export const WARRIOR_BLOP_BUNDLE = blopBundle(BLOP_TYPE.WARRIOR, {
  name: "Warrior Blop",
  health: 8,
  power: 4,
  ch: "W",
  fg: "red",
  ai: BLOP_AI,
  dna: 1,
});

export const COMPLEX_BLOP_BUNDLE = blopBundle(BLOP_TYPE.COMPLEX, {
  name: "Complex Blop",
  health: 5,
  power: 2,
  ch: "C",
  fg: "yellow",
  // TODO - assign more dna entries
  ai: BLOP_AI,
  dna: 2,
});

export const BLOP_DUMMY_BUNDLE = blopBundle(BLOP_TYPE.BLOP_DUMMY, {
  name: "Dummy Blop",
  health: 5,
  power: 0,
  ch: "d",
  fg: "red",
  colliderTags: ["dummy", "blop"],
  flags: "OBSERVE", // No "appears" messages
  dropChance: 0,
});

export const HERO_DUMMY_BUNDLE = blopBundle(BLOP_TYPE.HERO_DUMMY, {
  name: "Dummy Blop",
  health: 5,
  power: 0,
  ch: "d",
  fg: "green",
  team: "hero",
  colliderTags: ["dummy", "ally"],
  flags: "OBSERVE", // No "appears" messages
  dropChance: 0,
});

export const HERO_MINI_BUNDLE = blopBundle(BLOP_TYPE.HERO_MINI, {
  name: "Mini Blop",
  health: 4,
  power: 1,
  ch: "m",
  fg: "green",
  team: "hero",
  dropChance: 0,
  colliderTags: ["ally", "actor"],
  ai: [aiAttackNeighbor, aiRandomMove, aiWait],
  flags: "OBSERVE", // No "appears" messages
  config: { moveRandomly: 50 },
});

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
