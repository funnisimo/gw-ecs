import { QueueSystem, type RunIfFn } from "gw-ecs/system";
import { GameEvent } from "../queues";
import type { World } from "gw-ecs/world";
import { Schedule } from "gw-ecs/common";
import { Actor } from "../comps";
import type { Entity } from "gw-ecs/entity";

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
      rescheduleEntity(world, item.entity, item.time);
    }
  }
}

export function rescheduleEntity(
  world: World,
  entity: Entity,
  actTime?: number
) {
  if (actTime === undefined || actTime < 0) {
    const actor = entity.fetch(Actor);
    if (actor) {
      actTime = actor.actTime;
    }
  }
  console.log("- entity reschedule", entity.index, actTime);
  const schedule = world.getUnique(Schedule);
  schedule.add(entity, actTime);

  // To help find actors that are not being rescheduled
  // TODO - Remove once things are working
  const actor = entity.fetch(Actor);
  if (actor) {
    actor.scheduled = true;
  }
}
