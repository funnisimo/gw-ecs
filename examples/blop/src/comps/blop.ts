import { Aspect } from "gw-ecs/world";
import { Sprite, type SpriteConfig } from "./sprite";
import { Bundle } from "gw-ecs/entity";
import { Collider } from "gw-ecs/common";
import { Actor, type AiFn } from "./actor";
import { EntityFlags, EntityInfo } from "./entityInfo";

export interface SpawnInfo {
  average: number;
  deviation: number;
  weight: number;
}

export class Blop {
  type: string;
  health: number;
  maxHealth: number;
  power: number;
  charge: number;
  maxCharge: number;
  spawn: SpawnInfo | null;

  constructor(
    type: string,
    maxHealth: number,
    power: number = 1,
    spawn: SpawnInfo | null = null
  ) {
    this.type = type;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.power = power;
    this.charge = 0; // Charge is extra damage done on next attack
    this.maxCharge = 5;
    this.spawn = spawn;
  }

  isType(type: string): boolean {
    return this.type === type;
  }
}

export const BLOP_ASPECT = new Aspect(Blop);

export interface BlopConfig extends SpriteConfig {
  name: string;
  health?: number;
  power?: number;
  maxChange?: number;
  spawn?: SpawnInfo;
  ai?: AiFn[];
}

export function blopBundle(type: string, config: BlopConfig): Bundle {
  const ai = config.ai || [];
  const bundle = new Bundle(
    () =>
      new Blop(
        type,
        config.health || 4,
        config.power || 1,
        config.spawn || null
      )
  )
    .with(new Sprite(config.ch, config.fg, config.bg))
    .with(new Collider("blop", "actor"))
    // TODO - AI?
    .with(new Actor(...ai))
    // TODO - Drops
    // TODO - DNA
    .with(new EntityInfo(config.name, "ALWAYS_INTERRUPT"));
  return bundle;
}
