import type { GameEvent } from "../queues";
import type { Entity } from "gw-ecs/entity";
import { PosManager } from "gw-ecs/common/positions";
import { findEmptyTileForSpawn } from "../map/utils";
import { Blop, EffectSprite, Hero, Pickup } from "./index";
import { addLog, coloredName } from "../ui/log";
import type { Level } from "gw-ecs/world";
import { random, type Random } from "gw-utils/rng";

export abstract class Effect {
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  abstract apply(level: Level, event: GameEvent, owner: Entity): boolean;
}

export class TeleportEffect extends Effect {
  constructor() {
    super("Teleport", "teleports the owner to a new location on the level.");
  }

  apply(level: Level, event: GameEvent, owner: Entity) {
    const posMgr = level.getUnique(PosManager);

    const newXY = findEmptyTileForSpawn(level);
    posMgr.set(owner, newXY.x, newXY.y);

    // TODO - emit teleport event?
    addLog(`${coloredName(owner)} teleports.`);
    return true;
  }
}

export class HealEffect extends Effect {
  constructor() {
    super("Heal", "heals the owner 1 HP.");
  }
  apply(level: Level, event: GameEvent, owner: Entity): boolean {
    if (!owner.has(Blop)) return false;
    const blop = owner.update(Blop)!;
    if (blop.maxHealth <= blop.health) {
      return false;
    }
    blop.health += 1;
    // TODO - add heal amount to event?
    // TODO - emit heal event?
    addLog(`${coloredName(owner)} is healed for 1 HP.`);
    return true;
  }
}

export class HurtSelfEffect extends Effect {
  constructor() {
    super("HurtSelf", "injurs the owner 1 HP.");
  }
  apply(level: Level, event: GameEvent, owner: Entity): boolean {
    if (!owner.has(Blop)) return false;
    const blop = owner.update(Blop)!;
    if (blop.health <= 0) {
      return false;
    }
    blop.health -= 1;
    // TODO - add damage amount to event?
    // TODO - emit hurt event? (for onLoseLife?)
    addLog(`${coloredName(owner)} is hurt for 1 HP.`);
    return true;
  }
}

// destroywalls
// shock
// cleave
// summonally
// summondummy
// explode
// gaincharge
// shootlaser

export const effectClasses = [TeleportEffect, HealEffect, HurtSelfEffect];

export function createRandomEffect(level: Level, rng?: Random): Entity {
  rng = rng || random;
  const cls = rng.item(effectClasses);
  const effect = new cls();
  return level.create(EffectSprite, effect, Pickup);
}
