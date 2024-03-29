import type { Entity } from "gw-ecs/entity";
import { Aspect, type World } from "gw-ecs/world";

export type PickupFn = (world: World, actor: Entity, item: Entity) => void;

export class Pickup {
  fn: PickupFn;

  constructor(fn: PickupFn) {
    this.fn = fn;
  }
}

export const PICKUP_ASPECT = new Aspect(Pickup);
