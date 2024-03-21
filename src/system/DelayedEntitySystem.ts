import { Aspect } from "../world/aspect.js";
import { IntervalEntitySystem } from "./intervalEntitySystem.js";

export abstract class DelayedEntitySystem extends IntervalEntitySystem {
  public constructor(aspect: Aspect, delay: number) {
    super(aspect, 0, delay);
  }
}
