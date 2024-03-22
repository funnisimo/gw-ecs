import { World } from "../world/world.js";
import { System } from "./system.js";

export class IntervalTracker {
  _runIn: number;
  _runEvery: number;
  catchUp: boolean = true;
  enabled: boolean = true;

  constructor(runEvery: number, startIn?: number) {
    this._runEvery = runEvery;
    this._runIn = startIn === undefined ? runEvery : startIn;
  }

  runIn(delay: number) {
    this._runIn = delay;
    this.enabled = true;
  }

  shouldRun(delta: number): boolean {
    if (!this.enabled) return false;

    this._runIn -= delta;
    if (this._runIn > 0) return false;
    if (this._runEvery == 0) {
      this.enabled = false;
    } else {
      this._runIn += this._runEvery;
      // TODO - there is a way to do this without the loop
      while (this._runIn < 0 && !this.catchUp) {
        this._runIn += this._runEvery;
      }
    }
    return true;
  }
}

export class IntervalSystem extends System {
  _tracker: IntervalTracker;

  constructor(runEvery: number, startIn?: number) {
    super();
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

export class DelayedSystem extends IntervalSystem {
  constructor(delay: number) {
    super(0, delay);
  }

  runIn(delay: number) {
    this._tracker.runIn(delay);
  }
}
