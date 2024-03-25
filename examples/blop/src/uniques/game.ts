import type { Entity } from "gw-ecs/entity";
import type { XY } from "gw-utils";

export class Game {
  hero: Entity | null;
  depth: number;
  changed: boolean;
  // focus: XY | null;
  ready: boolean;

  constructor() {
    this.hero = null;
    this.depth = 0;
    this.changed = true;
    // this.focus = null;
    this.ready = true;
  }
}
