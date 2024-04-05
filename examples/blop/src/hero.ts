import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { Actor, Blop, DNA, Hero, EntityInfo, Sprite } from "./comps";
import { Collider } from "gw-ecs/common";
import { BLOP_TYPE } from "./blops";
import { aiTravel } from "./ai";
import { WaitTrigger } from "./dnaTriggers";
import { HealEffect } from "./dnaEffects";

export function createHero(world: World): Entity {
  const dna = new DNA(2);
  dna.triggers[0] = new WaitTrigger();
  dna.effects[0] = new HealEffect();

  return world.create(
    new Hero(),
    new Sprite("@", "yellow"),
    new Collider("hero", "actor"),
    new Blop(BLOP_TYPE.HERO, 20, 2),
    new Actor(aiTravel), // Try to travel to location
    dna,
    new EntityInfo("Hero", "OBSERVE")
  );
}
