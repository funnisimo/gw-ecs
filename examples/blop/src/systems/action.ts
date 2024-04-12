import { Aspect, Entity } from "gw-ecs/entity";
import { EntitySystem, type RunIfFn } from "gw-ecs/system";
import { Action } from "../comps";
import type { World } from "gw-ecs/world";

export class ActionSystem extends EntitySystem {
  constructor(runIf?: RunIfFn) {
    super(new Aspect(Action), runIf);
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const action = entity.remove(Action);
    action && action.act(world, entity);
  }
}
