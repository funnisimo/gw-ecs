import { RunResult, Schedule, ScheduleSystem } from "gw-ecs/common";
import type { RunIfFn } from "gw-ecs/system";
import type { World } from "gw-ecs/world";
import { Action, Actor } from "../comps";
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
        // NOTE - Using 2x because we want newly created blops to have 1 turn pause before acting.
        schedule.add(entity, comp.actTime * 2); // TODO - Randomize a little
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
    const game = world.getUnique(Game);
    if (game.over) return RunResult.Ok; // We are done - ok to remove this entity

    const actor = entity.fetch(Actor);
    if (!actor) {
      // TODO - Exception?
      console.log("game turn for entity with no Actor component!");
      return RunResult.Ok; // Removes this entity from the schedule
    }

    if (!actor.ready) {
      if (!actor.ai.length) {
        console.log("game turn for entity with no ai functions!");
        return RunResult.Ok; // Remove this entity from the schedule
      }

      if (!actor.ai.some((aiFn) => aiFn(world, entity, time, delta))) {
        return RunResult.Retry; // Will be unshifted back onto schedule and remain as first entity
      }
    }
    game.changed = true;
    // actor.ready = false;
    actor.scheduled = false;
    super.runEntity(world, entity, time, delta);
    if (!actor.scheduled) {
      console.log(" - Entity will retry", entity.index);
      return RunResult.Retry;
    }

    // If our hero is acting then break so we can draw
    return entity === game.hero ? RunResult.Break : RunResult.Ok;
  }
}
