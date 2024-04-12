import type { Entity } from "gw-ecs/entity/entity";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Aspect } from "gw-ecs/entity";
import type { World } from "gw-ecs/world/world";
import {
  Hero,
  PICKUP_ASPECT,
  Pickup,
  PickupItem,
  TravelTo,
  removeAction,
  takeTurn,
} from "../comps";
import { pick } from "gw-utils/object";
import { Log } from "../uniques";
import { GameEvent } from "../queues";

export class PickupSystem extends EntitySystem {
  constructor() {
    // Do not run if the hero is traveling to another location
    super(new Aspect(PickupItem));
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const pickupItem = removeAction(entity, PickupItem)!;

    let item = pickupItem.item;
    if (!item) {
      const posMgr = world.getUnique(PosManager);
      const pos = entity.fetch(Pos)!;

      item = posMgr.firstAt(pos.x, pos.y, PICKUP_ASPECT);

      if (!item) {
        world.getUnique(Log).add("Nothing to pickup.");
        return;
      }
    }

    const pickup = item.fetch(Pickup)!;
    console.log("pickup");
    if (pickup.fn(world, entity, item) !== false) {
      takeTurn(world, entity);
    }
  }
}
