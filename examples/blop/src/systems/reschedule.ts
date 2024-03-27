import { QueueSystem, type RunIfFn } from "gw-ecs/system";
import { GameEvent } from "../queues";
import type { World } from "gw-ecs/world";
import { Schedule } from "gw-ecs/common";
import { Actor, takeTurn } from "../comps";

export class RescheduleSystem extends QueueSystem<GameEvent> {
  constructor(runIf?: RunIfFn) {
    super(GameEvent, runIf);
  }

  runQueueItem(
    world: World,
    item: GameEvent,
    time: number,
    delta: number
  ): void {
    if (item.type === "turn") {
      takeTurn(world, item.entity);
    }
  }
}
