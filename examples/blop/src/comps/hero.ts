import { type Entity } from "gw-ecs/entity";
import { type World, Aspect } from "gw-ecs/world";
import { HeroSprite } from "./sprite";
import { Collider } from "gw-ecs/common/collisions";
import { Blop } from "./blop";
import { DNA } from "./dna";
import { WaitTrigger } from ".";
import { HealEffect } from "./effect";
import { Name } from "./name";

export class Hero {}

export const HERO_ASPECT = new Aspect(Hero);

export function createHero(world: World): Entity {
  const dna = new DNA(2);
  dna.triggers[0] = new WaitTrigger();
  dna.effects[0] = new HealEffect();

  return world.create(
    new Hero(),
    HeroSprite,
    new Collider("hero", "actor"),
    new Blop("Hero", 20, 2),
    dna,
    new Name("Hero")
  );
}
