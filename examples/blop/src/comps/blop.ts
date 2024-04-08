import { Aspect } from "gw-ecs/entity";
import { Sprite, type SpriteConfig } from "./sprite";
import { Bundle } from "gw-ecs/entity";
import { Collider } from "gw-ecs/common";
import { Actor, type AiFn } from "./actor";
import { EntityInfo } from "./entityInfo";
import * as Constants from "../constants";
import type { FlagBase } from "gw-utils/flag";

export interface SpawnInfo {
  average: number;
  deviation: number;
  weight: number;
}

export interface BlopConfig {
  health?: number;
  power?: number;
  maxChange?: number;
  // spawn?: SpawnInfo;
  team?: string;
  dropChance?: number;
}

export class Blop {
  type: string;
  health: number;
  maxHealth: number;
  power: number;
  charge: number;
  maxCharge: number;
  // spawn: SpawnInfo | null;
  team: string;
  dropChance: number;

  constructor(type: string, config: BlopConfig) {
    this.type = type;
    this.health = config.health || 4;
    this.maxHealth = this.health;
    this.power = config.power === undefined ? 1 : config.power;
    this.charge = 0; // Charge is extra damage done on next attack
    this.maxCharge = config.maxChange || 5;
    // this.spawn = spawn;
    this.team = config.team || "blop";
    this.dropChance =
      config.dropChance === undefined
        ? Constants.BLOP_DROP_CHANCE
        : config.dropChance;
  }

  isType(type: string): boolean {
    return this.type === type;
  }
}

export const BLOP_ASPECT = new Aspect(Blop);

export interface BlopBundleConfig extends SpriteConfig, BlopConfig {
  name: string;
  ai?: AiFn[];
  colliderTags?: string[];
  flags?: FlagBase;
}

export function blopBundle(type: string, config: BlopBundleConfig): Bundle {
  const ai = config.ai || [];
  const tags = config.colliderTags || ["actor"];
  const flags = config.flags || "ALWAYS_INTERRUPT, OBSERVE";

  const bundle = new Bundle(() => new Blop(type, config))
    .with(new Sprite(config.ch, config.fg, config.bg))
    .with(new Collider("blop", ...tags))
    // TODO - AI?
    .with(new Actor(...ai))
    // TODO - Drops
    // TODO - DNA
    .with(new EntityInfo(config.name, flags));
  return bundle;
}
