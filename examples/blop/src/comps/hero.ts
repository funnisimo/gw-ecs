import type { Entity } from "gw-ecs/entity/entity";
import type { World } from "gw-ecs/world/world";
import { HeroSprite } from "./sprite";
import { Collider } from "gw-ecs/utils/collisions";

export class Hero {}

export function createHero(world: World): Entity {
  return world.create(new Hero(), HeroSprite, new Collider("hero", "actor"));
}
