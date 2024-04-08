import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { Actor, Blop, DNA, Hero, EntityInfo, Sprite } from "./comps";
import { Collider } from "gw-ecs/common";
import { BLOP_TYPE } from "./blops";
import { aiTravel } from "./ai";
import { AttackTrigger, WaitTrigger } from "./dnaTriggers";
import {
  DestroyWallsEffect,
  ExplodeEffect,
  ExtendEffect,
  ShockEffect,
  SummonDummyEffect,
  SwipeEffect,
  SwirlEffect,
} from "./dnaEffects";

export function createHero(world: World): Entity {
  const dna = new DNA(2);
  dna.triggers[0] = new WaitTrigger();
  dna.effects[0] = new SummonDummyEffect();

  return world.create(
    new Hero(),
    new Sprite("@", "yellow"),
    new Collider("hero", "actor"),
    new Blop(BLOP_TYPE.HERO, { health: 20, power: 2, team: "hero" }),
    new Actor(aiTravel), // Try to travel to location
    dna,
    new EntityInfo("Hero", "OBSERVE")
  );
}
