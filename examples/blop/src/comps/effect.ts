import type { GameEvent } from "../queues";
import type { Entity } from "gw-ecs/entity";
import { PosManager } from "gw-ecs/common/positions";
import { findEmptyTileForSpawn } from "../map/utils";
import { Blop, EffectSprite, Hero, Pickup } from "./index";
import { addLog, coloredName } from "../ui/log";
import { Aspect, type World } from "gw-ecs/world";
import { random, type Random } from "gw-utils/rng";
import { App } from "gw-utils/app";

export class Effect {
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  apply(world: World, event: GameEvent, owner: Entity): boolean {
    return false;
  }
}

export const EFFECT_ASPECT = new Aspect(Effect);

export class TeleportEffect extends Effect {
  constructor() {
    super("Teleport", "teleports the owner to a new location on the world.");
  }

  apply(world: World, event: GameEvent, owner: Entity) {
    const posMgr = world.getUnique(PosManager);

    const newXY = findEmptyTileForSpawn(world);
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
  apply(world: World, event: GameEvent, owner: Entity): boolean {
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
  apply(world: World, event: GameEvent, owner: Entity): boolean {
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

export function createRandomEffect(world: World, rng?: Random): Entity {
  rng = rng || random;
  const cls = rng.item(effectClasses);
  const effect = new cls();
  return world.create(EffectSprite, effect, new Pickup(pickupEffect));
}

export function pickupEffect(world: World, actor: Entity, item: Entity) {
  if (!item.has(Effect)) return;
  if (!actor.has(Hero)) return;

  const app = world.getUnique(App);
  app.show("add_dna", { world, entity: actor, chromosome: item });
  // TODO - run 'add_to_dna' scene
}
