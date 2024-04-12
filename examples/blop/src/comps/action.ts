import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";

export class Action {
  act(world: World, actor: Entity) {}
}
