import { EntitySystem, type RunIfFn } from "gw-ecs/system";
import { Aspect, World } from "gw-ecs/world";
import { Wait, removeAction } from "../comps";
import type { Entity } from "gw-ecs/entity";
import { GameEvent } from "../queues";

export class WaitSystem extends EntitySystem {
  constructor(runIf?: RunIfFn) {
    super(new Aspect(Wait), runIf);
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    removeAction(entity, Wait);
    world.pushQueue(new GameEvent(entity, "wait"));
    world.pushQueue(new GameEvent(entity, "turn", { time: 0 }));
  }
}
