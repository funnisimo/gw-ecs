import { IntervalSystem } from "./intervalSystem";
import { Aspect } from "../core/aspect";
import { Entity } from "../core";

export abstract class IntervalEntitySystem extends IntervalSystem {
  private _aspect: Aspect;

  constructor(aspect: Aspect, interval: number, delay?: number) {
    super(interval, delay);
    this._aspect = aspect;
  }

  protected doProcess(): void {
    for (let e of this.world.entities().alive()) {
      if (this._aspect.accept(e.allComponents())) {
        this.processEntity(e);
      }
    }
  }

  protected abstract processEntity(entity: Entity): void;
}
