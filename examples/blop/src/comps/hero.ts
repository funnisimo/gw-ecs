import { type Entity } from "gw-ecs/entity";
import { type World, Aspect } from "gw-ecs/world";
import { HeroSprite } from "./sprite";
import { Collider } from "gw-ecs/common/collisions";
import { Blop } from "./blop";
import { DNA } from "./dna";
import { MoveDirTrigger } from ".";
import { HealEffect } from "./effect";

export class Hero {}

export const HERO_ASPECT = new Aspect(Hero);

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
