import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import {
  Blop,
  DNA,
  HealEffect,
  Hero,
  Name,
  Sprite,
  WaitTrigger,
} from "./comps";
import { Collider } from "gw-ecs/common";
import { BLOP_TYPE } from "./blops";

export function createHero(world: World): Entity {
  const dna = new DNA(2);
  dna.triggers[0] = new WaitTrigger();
  dna.effects[0] = new HealEffect();

  return world.create(
    new Hero(),
    new Sprite("@", "yellow"),
    new Collider("hero", "actor"),
    new Blop(BLOP_TYPE.HERO, 20, 2),
    dna,
    new Name("Hero")
  );
}
