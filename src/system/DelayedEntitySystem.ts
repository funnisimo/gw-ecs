import { DelayedSystem } from "./delayedSystem.js";
import { Entity } from "../entity/entity.js";
import { Aspect } from "../world/aspect.js";

export abstract class DelayedEntitySystem extends DelayedSystem {
  private _aspect: Aspect;

  public constructor(aspect: Aspect, delay: number) {
    super(delay);
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
