import { DelayedSystem } from "./delayedSystem";
import { Entity } from "../core";
import { Aspect } from "../core/aspect";

export abstract class DelayedEntitySystem extends DelayedSystem {
  private _aspect: Aspect;

  public constructor(aspect: Aspect, delay: number) {
    super(delay);
    this._aspect = aspect;
  }

  accept(entity: Entity): boolean {
    return this._aspect.accept(entity, this.lastTick);
  }

  protected doProcess(): void {
    for (let e of this.world.entities().alive()) {
      if (this.accept(e)) {
        this.processEntity(e);
      }
    }
  }

  protected abstract processEntity(entity: Entity): void;
}
