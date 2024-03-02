import { IntervalSystem } from "./intervalSystem";
import { Aspect } from "../core/aspect";
import { Entity } from "../core";

export abstract class IntervalEntitySystem extends IntervalSystem {
  private _aspect: Aspect;

  constructor(aspect: Aspect, interval: number, delay?: number) {
    super(interval, delay);
    this._aspect = aspect;
  }

  accept(entity: Entity): boolean {
    return this._aspect.accept(entity, this.lastTick);
  }

  protected doProcess(): void {
    for (let e of this.world.entities()) {
      if (this.accept(e)) {
        this.processEntity(e);
      }
    }
  }

  protected abstract processEntity(entity: Entity): void;
}
