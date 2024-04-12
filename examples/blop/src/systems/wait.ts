import { EntitySystem, type RunIfFn } from "gw-ecs/system";
import { World } from "gw-ecs/world";
import { Wait, removeAction, takeTurn } from "../comps";
import { type Entity, Aspect } from "gw-ecs/entity";
import { GameEvent } from "../queues";

export class WaitSystem extends EntitySystem {
  constructor(runIf?: RunIfFn) {
    super(new Aspect(Wait), runIf);
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const wait = removeAction(entity, Wait)!;
    if (wait.queueGameEvent) {
      world.pushQueue(new GameEvent(entity, "wait"));
    }
    takeTurn(world, entity);
  }
}
