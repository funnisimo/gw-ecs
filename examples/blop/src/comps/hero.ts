import type { Entity } from "gw-ecs/entity/entity";
import type { World } from "gw-ecs/world/world";
import { HeroSprite } from "./sprite";
import { Collider } from "gw-ecs/utils/collisions";
import { Blop } from "./blop";
import { DNA } from "./dna";
import { MoveDirTrigger } from ".";
import { HealEffect } from "./effect";

export class Hero {}

export function createHero(world: World): Entity {
  const dna = new DNA(2);
  dna.triggers[0] = new MoveDirTrigger();
  dna.effects[0] = new HealEffect();

  return world.create(
    new Hero(),
    HeroSprite,
    new Collider("hero", "actor"),
    new Blop("Hero", 20),
    dna
  );
}
