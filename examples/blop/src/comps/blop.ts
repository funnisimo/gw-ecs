import { Aspect } from "gw-ecs/entity";
import { Sprite, type SpriteConfig } from "./sprite";
import { Bundle } from "gw-ecs/entity";
import { Collider } from "gw-ecs/common";
import { Actor, type AiFn } from "./actor";
import { EntityInfo } from "./entityInfo";
import * as Constants from "../constants";
import type { FlagBase } from "gw-utils/flag";
import { DNA } from "./dna";
import type { World } from "gw-ecs/world";
import { Random, random } from "gw-utils/rng";
import { triggerClasses } from "../dnaTriggers";
import { effectClasses } from "../dnaEffects";

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
