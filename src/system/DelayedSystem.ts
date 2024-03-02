import { IntervalSystem } from "./intervalSystem";

export abstract class DelayedSystem extends IntervalSystem {
  public constructor(delay: number) {
    super(0, delay);
  }

  public runIn(delay: number) {
    this.delay = delay;
    this.setEnabled(true);
  }
}
