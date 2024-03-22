import { Aspect } from "../world/aspect.js";
import { World } from "../world/world.js";
import { EntitySystem } from "./entitySystem.js";
import { IntervalTracker } from "./intervalSystem.js";

export abstract class IntervalEntitySystem extends EntitySystem {
  _tracker: IntervalTracker;

  public constructor(aspect: Aspect, runEvery: number, startIn?: number) {
    super(aspect);
    this._tracker = new IntervalTracker(runEvery, startIn);
  }

  setCatchUp(catchUp: boolean): void {
    this._tracker.catchUp = catchUp;
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    if (!super.shouldRun(world, time, delta)) return false;
    return this._tracker.shouldRun(delta);
  }
}

export abstract class DelayedEntitySystem extends IntervalEntitySystem {
  public constructor(aspect: Aspect, delay: number) {
    super(aspect, 0, delay);
  }

  runIn(delta: number) {
    this._tracker.runIn(delta);
  }
}
