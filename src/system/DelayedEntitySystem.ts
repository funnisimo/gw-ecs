import { DelayedSystem } from "./delayedSystem.js";
import { Entity } from "../entity/entity.js";
import { Aspect } from "../world/aspect.js";
import { World } from "../world/world.js";

export abstract class DelayedEntitySystem extends DelayedSystem {
  private _aspect: Aspect;

  public constructor(aspect: Aspect, delay: number) {
    super(delay);
    this._aspect = aspect;
  }

  accept(entity: Entity): boolean {
    return this._aspect.match(entity, this.lastTick);
  }

  protected process(world: World, time: number, delta: number): void {
    for (let e of this._aspect.all(world, this.lastTick)) {
      this.processEntity(e, world, time, delta);
    }
  }

  protected abstract processEntity(
    entity: Entity,
    world: World,
    time: number,
    delta: number
  ): void;
}
