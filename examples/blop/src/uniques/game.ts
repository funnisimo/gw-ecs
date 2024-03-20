import type { Entity } from "gw-ecs/entity/entity";
import type { XY } from "gw-utils";

export class Game {
  hero: Entity | null;
  depth: number;
  changed: boolean;
  focus: XY | null;

  constructor() {
    this.hero = null;
    this.depth = 0;
    this.changed = true;
    this.focus = null;
  }
}
