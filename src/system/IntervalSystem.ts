import { World } from "../world/world.js";
import { System } from "./system.js";

export abstract class IntervalSystem extends System {
  protected delay: number;
  protected interval: number;
  private catchUp: boolean = true;

  public constructor(runEvery: number, startIn?: number) {
    super();
    this.interval = runEvery;
    this.delay = startIn === undefined ? runEvery : startIn;
  }

  public setCatchUp(catchUp: boolean): void {
    this.catchUp = catchUp;
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    if (!super.shouldRun(world, time, delta)) return false;
    this.delay -= delta;
    if (this.delay > 0) return false;
    if (this.interval == 0) {
      this.setEnabled(false);
    } else {
      this.delay += this.interval;
      // TODO - there is a way to do this without the loop
      while (this.delay < 0 && !this.catchUp) {
        this.delay += this.interval;
      }
    }
    return true;
  }
}
