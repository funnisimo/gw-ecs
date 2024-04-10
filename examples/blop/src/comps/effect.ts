import type { GameEvent } from "../queues";
import { Aspect, Entity } from "gw-ecs/entity";
import { type World } from "gw-ecs/world";

export class Effect {
  // TODO - Move effect name+description to EntityInfo
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  /**
   * Applies the effect to the world
   * @param world
   * @param event
   * @param owner
   * @returns - Returns whether or not it actually fired.
   */
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    return false;
  }
}

export const EFFECT_ASPECT = new Aspect(Effect);
