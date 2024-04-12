import { Aspect, type Entity } from "gw-ecs/entity";
import { type World } from "gw-ecs/world";
import { Action } from "./action";
import { Pos, PosManager } from "gw-ecs/common";
import { Log } from "../uniques";
import { takeTurn } from "./actor";

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

//////////////////////////////////////
//

export class PickupItem extends Action {
  item?: Entity;

  constructor(item?: Entity) {
    super();
    this.item = item;
  }

  act(world: World, actor: Entity): void {
    let item = this.item;
    if (!item) {
      const posMgr = world.getUnique(PosManager);
      const pos = actor.fetch(Pos)!;

      item = posMgr.firstAt(pos.x, pos.y, PICKUP_ASPECT);

      if (!item) {
        world.getUnique(Log).add("Nothing to pickup.");
        return;
      }
    }

    const pickup = item.fetch(Pickup)!;
    console.log("pickup");
    if (pickup.fn(world, actor, item) !== false) {
      takeTurn(world, actor);
    }
  }
}
