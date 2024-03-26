import { Aspect } from "gw-ecs/world";
import { Sprite, type SpriteConfig } from "./sprite";
import { Bundle } from "gw-ecs/entity";
import { Collider } from "gw-ecs/common";
import { Name } from "./name";

export class Blop {
  name: string;
  health: number;
  maxHealth: number;
  power: number;
  charge: number;
  maxCharge: number;

  constructor(name: string, maxHealth: number, power: number = 2) {
    this.name = name;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.power = power;
    this.charge = 0; // Charge is extra damage done on next attack
    this.maxCharge = 5;
  }
}

export const BLOP_ASPECT = new Aspect(Blop);

export interface BlopBundleConfig extends SpriteConfig {
  name: string;
  health?: number;
  power?: number;
  maxChange?: number;
}

export function blopAndBundle(config: BlopBundleConfig): [Blop, Bundle] {
  const blop = new Blop(config.name, config.health || 4, config.power);
  return [
    blop,
    new Bundle(blop)
      .with(new Sprite(config.ch, config.fg, config.bg))
      .with(new Collider("blop", "actor"))
      // TODO - AI?
      // TODO - Combat?
      // TODO - Drops
      // TODO - DNA
      .with(new Name(blop.name)),
  ];
}

export const [MINI_BLOP, MINI_BLOP_BUNDLE] = blopAndBundle({
  name: "Mini Blop",
  health: 2,
  power: 1,
  ch: "b",
  fg: "brown",
});

export const [SMALL_BLOP, SMALL_BLOP_BUNDLE] = blopAndBundle({
  name: "Small Blop",
  health: 4,
  power: 2,
  ch: "b",
  fg: "orange",
});

export const [FAT_BLOP, FAT_BLOP_BUNDLE] = blopAndBundle({
  name: "Fat Blop",
  health: 12,
  power: 1,
  ch: "F",
  fg: "pink",
});

export const [WARRIOR_BLOP, WARRIOR_BLOP_BUNDLE] = blopAndBundle({
  name: "Warrior Blop",
  health: 8,
  power: 4,
  ch: "W",
  fg: "red",
});

export const [COMPLEX_BLOP, COMPLEX_BLOP_BUNDLE] = blopAndBundle({
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
