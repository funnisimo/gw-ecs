import type { GameEvent } from "../queues";
import { Aspect, Entity } from "gw-ecs/entity";
import { type World } from "gw-ecs/world";

export type TriggerFn = (event: GameEvent, owner: Entity) => boolean;

export class Trigger {
  // TODO - Move trigger name+description to EntityInfo
  name: string;
  description: string;
  // TODO - track lastTick?  Only fire once per tick cycle?  Constructor option?

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return false;
  }
}

export const TRIGGER_ASPECT = new Aspect(Trigger);
