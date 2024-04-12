import { Aspect, type Entity } from "gw-ecs/entity";
import { type World } from "gw-ecs/world";

export type PickupFn = (
  world: World,
  actor: Entity,
  item: Entity
) => boolean | void;

export class Pickup {
  fn: PickupFn;

  constructor(fn: PickupFn) {
    this.fn = fn;
  }
}

export const PICKUP_ASPECT = new Aspect(Pickup);

export class PickupItem {
  item?: Entity;

  constructor(item?: Entity) {
    this.item = item;
  }
}

export const PICKUP_ITEM_ASPECT = new Aspect(PickupItem);
