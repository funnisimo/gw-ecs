import { Schedule, ScheduleSystem } from "gw-ecs/common";
import type { RunIfFn } from "gw-ecs/system";
import type { World } from "gw-ecs/world";
import { Actor } from "../comps";
import type { Entity } from "gw-ecs/entity";
import { coloredName } from "../utils";
import { Log } from "../uniques";

export class GameTurnSystem extends ScheduleSystem {
  constructor(setName: string, runIf?: RunIfFn) {
    super(setName, runIf); // gameReady
  }

  start(world: World) {
    super.start(world);
    const schedule = world.getUniqueOr(Schedule, () => {
      throw new Error("Missing Schedule unique.");
    });

    const blops = world.getStore(Actor)!;
    blops.forEach((entity, comp) => {
      schedule.add(entity, comp.actTime); // TODO - Randomize a little
    });

    blops.notify({
      compSet: (entity, comp) => {
        schedule.add(entity, comp.actTime); // TODO - Randomize a little
      },
      compRemoved(entity, _comp) {
        schedule.remove(entity);
      },
    });
  }

  runEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    const actor = entity.fetch(Actor);
    if (!actor) {
      // TODO - Exception?
      console.log("game turn for entity with no Actor component!");
      return true; // Removes this entity from the schedule
    }

    if (
      !actor.ready &&
      !actor.ai.some((aiFn) => aiFn(world, entity, time, delta))
    ) {
      return false; // Will be unshifted back onto schedule and remain as first entity
    }
    actor.ready = false;
    actor.scheduled = false;
    super.runEntity(world, entity, time, delta);
    if (!actor.scheduled) {
      console.warn("Entity not rescheduled.");
    }
    return true;
  }
}
