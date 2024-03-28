import type { XY } from "gw-utils";

export class TravelTo {
  goal: XY;

  constructor(goal: XY) {
    this.goal = goal;
  }
}
