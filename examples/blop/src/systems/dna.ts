import { System, type RunIfFn } from "gw-ecs/system/system";
import type { QueueReader } from "gw-ecs/world/queue";
import type { World } from "gw-ecs/world/world";
import { GameEvent } from "../queues";
import { DNA } from "../comps/dna";
import { Log } from "../uniques";
import type { Entity } from "gw-ecs/entity";
import { QueueSystem } from "gw-ecs/system";
import { coloredName } from "../comps";

export class DnaSystem extends QueueSystem<GameEvent> {
  constructor(runIf?: RunIfFn) {
    super(GameEvent, runIf);
  }

  runQueueItem(
    world: World,
    event: GameEvent,
    time: number,
    delta: number
  ): void {
    if (event.entity && event.entity.has(DNA)) {
      this.tryFire(world, event, event.entity);
    }
    if (
      event.target &&
      event.target !== event.entity &&
      event.target.has(DNA)
    ) {
      this.tryFire(world, event, event.target);
    }
  }

  tryFire(world: World, event: GameEvent, entity: Entity) {
    console.log("- event: " + event.type);
    let dna = entity.fetch(DNA)!;
    for (let i = 0; i < dna.length; ++i) {
      const trigger = dna.getTrigger(i);
      if (trigger && trigger.matches(world, event, entity)) {
        const effect = dna.getEffect(i);
        if (effect) {
          world
            .getUnique(Log)
            .add(
              `#{teal}${trigger.name}#{}:#{green}${
                effect.name
              }#{} of ${coloredName(entity)} is triggered.`
            );
          effect.apply(world, event, entity);
        }
      }
    }
  }
}
