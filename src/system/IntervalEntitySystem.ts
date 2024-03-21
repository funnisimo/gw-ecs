import { Aspect } from "../world/aspect.js";
import { World } from "../world/world.js";
import { EntitySystem } from "./entitySystem.js";

export abstract class IntervalEntitySystem extends EntitySystem {
  _runIn: number;
  _runEvery: number;
  _catchUp: boolean = true;

  public constructor(aspect: Aspect, runEvery: number, startIn?: number) {
    super(aspect);
    this._runEvery = runEvery;
    this._runIn = startIn === undefined ? runEvery : startIn;
  }

  setCatchUp(catchUp: boolean): void {
    this._catchUp = catchUp;
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    if (!super.shouldRun(world, time, delta)) return false;
    this._runIn -= delta;
    if (this._runIn > 0) return false;
    if (this._runEvery == 0) {
      this.setEnabled(false);
    } else {
      this._runIn += this._runEvery;
      // TODO - there is a way to do this without the loop
      while (this._runIn < 0 && !this._catchUp) {
        this._runIn += this._runEvery;
      }
    }
    return true;
  }
}
