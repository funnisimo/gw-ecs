import type { Entity } from "gw-ecs/entity/entity";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Aspect } from "gw-ecs/world";
import type { World } from "gw-ecs/world/world";
import { Hero, PICKUP_ASPECT, Pickup } from "../comps";

export class PickupSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Hero).updated(Pos));
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    // const game = world.getUnique(Game);
    const posMgr = world.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    const pickups = posMgr.getAt(pos.x, pos.y, PICKUP_ASPECT);

    pickups.forEach((item) => {
      const pickup = item.fetch(Pickup)!;
      console.log("pickup");
      pickup.fn(world, entity, item);
    });
  }
}
