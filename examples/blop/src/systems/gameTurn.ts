import { RunResult, Schedule, ScheduleSystem } from "gw-ecs/common";
import type { RunIfFn } from "gw-ecs/system";
import type { World } from "gw-ecs/world";
import { Actor } from "../comps";
import type { Entity } from "gw-ecs/entity";
import { coloredName } from "../utils";
import { Game, Log } from "../uniques";

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
  ): RunResult {
    const actor = entity.fetch(Actor);
    if (!actor) {
      // TODO - Exception?
      console.log("game turn for entity with no Actor component!");
      return RunResult.Ok; // Removes this entity from the schedule
    }

    if (
      !actor.ready &&
      !actor.ai.some((aiFn) => aiFn(world, entity, time, delta))
    ) {
      return RunResult.Retry; // Will be unshifted back onto schedule and remain as first entity
    }
    actor.ready = false;
    actor.scheduled = false;
    super.runEntity(world, entity, time, delta);
    if (!actor.scheduled) {
      console.warn("Entity not rescheduled.");
    }

    // If our hero is acting then break so we can draw
    const game = world.getUnique(Game);
    return entity === game.hero ? RunResult.Break : RunResult.Ok;
  }
}
