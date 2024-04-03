import { type XY, newXY } from "gw-utils/xy";

export class TravelTo {
  goal: XY;

  constructor(goal: XY) {
    this.goal = newXY(goal);
  }
}
