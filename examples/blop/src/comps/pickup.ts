import type { Entity } from "gw-ecs/entity";
import type { Level } from "gw-ecs/world";

export type PickupFn = (level: Level, actor: Entity, item: Entity) => void;

export class Pickup {
  fn: PickupFn;

  constructor(fn: PickupFn) {
    this.fn = fn;
  }
}
