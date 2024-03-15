import type { Entity } from "gw-ecs/entity/entity";
import type { World } from "gw-ecs/world/world";
import { HeroSprite } from "./sprite";

export class Hero {}

export function createHero(world: World): Entity {
  return world.create(new Hero(), HeroSprite);
}
