import { IntervalSystem } from "./intervalSystem.js";
import { Aspect } from "../world/aspect.js";
import { Entity } from "../entity/entity.js";

export abstract class IntervalEntitySystem extends IntervalSystem {
  private _aspect: Aspect;

  constructor(aspect: Aspect, interval: number, delay?: number) {
    super(interval, delay);
    this._aspect = aspect;
  }

  accept(entity: Entity): boolean {
    return this._aspect.match(entity, this.lastTick);
  }

  protected doProcess(): void {
    for (let e of this._aspect.all(this.world, this.lastTick)) {
      this.processEntity(e);
    }
  }

  protected abstract processEntity(entity: Entity): void;
}
