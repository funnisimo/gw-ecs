import { System } from "gw-ecs/system/system";
import type { QueueReader } from "gw-ecs/world/queue";
import type { World } from "gw-ecs/world/world";
import { GameEvent } from "../queues";
import { DNA } from "../comps/dna";
import { addLog, coloredName } from "../ui/log";
import type { Entity } from "gw-ecs/entity";

export class EventSystem extends System {
  reader!: QueueReader<GameEvent>;

  start(world: World): void {
    this.reader = world.getReader(GameEvent);
  }

  run(world: World, time: number, delta: number): void {
    this.reader.forEach((e) => {
      console.log("- event: " + e.type);
      if (e.entity && e.entity.has(DNA)) {
        this.tryFire(world, e, e.entity);
      }
      if (e.target && e.target !== e.entity && e.target.has(DNA)) {
        this.tryFire(world, e, e.target);
      }
    });
  }

  tryFire(world: World, event: GameEvent, entity: Entity) {
    let dna = event.entity.fetch(DNA)!;
    for (let i = 0; i < dna.length; ++i) {
      const trigger = dna.triggers[i];
      if (trigger && trigger.matches(world, event, entity)) {
        const effect = dna.effects[i];
        if (effect) {
          addLog(
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
