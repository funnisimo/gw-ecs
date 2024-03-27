import type { Entity } from "gw-ecs/entity";

export class Attack {
  target: Entity;

  constructor(target: Entity) {
    this.target = target;
  }
}
