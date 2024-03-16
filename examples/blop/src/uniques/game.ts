import type { Entity } from "gw-ecs/entity/entity";

export class Game {
  hero: Entity | null;
  depth: number;
  changed: boolean;

  constructor() {
    this.hero = null;
    this.depth = 0;
    this.changed = true;
  }
}
