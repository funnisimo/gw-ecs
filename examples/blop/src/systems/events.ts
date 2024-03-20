import { System } from "gw-ecs/system/system";
import type { QueueReader } from "gw-ecs/world/queue";
import type { Level } from "gw-ecs/world/level";
import { GameEvent } from "../queues";
import { DNA } from "../comps/dna";
import { addLog, coloredName } from "../ui/log";
import type { Entity } from "gw-ecs/entity";

export class EventSystem extends System {
  reader!: QueueReader<GameEvent>;

  start(level: Level): void {
    this.reader = level.getReader(GameEvent);
  }

  run(level: Level, time: number, delta: number): void {
    this.reader.forEach((e) => {
      console.log("- event: " + e.type);
      if (e.entity && e.entity.has(DNA)) {
        this.tryFire(level, e, e.entity);
      }
      if (e.target && e.target !== e.entity && e.target.has(DNA)) {
        this.tryFire(level, e, e.target);
      }
    });
  }

  tryFire(level: Level, event: GameEvent, entity: Entity) {
    let dna = event.entity.fetch(DNA)!;
    for (let i = 0; i < dna.length; ++i) {
      const trigger = dna.triggers[i];
      if (trigger && trigger.matches(level, event, entity)) {
        const effect = dna.effects[i];
        if (effect) {
          addLog(
            `#{teal}${trigger.name}#{}:#{green}${
              effect.name
            }#{} of ${coloredName(entity)} is triggered.`
          );
          effect.apply(level, event, entity);
        }
      }
    }
  }
}
