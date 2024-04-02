import type { Entity } from "gw-ecs/entity";

export class Interrupt {
  entity: Entity;

  constructor(entity: Entity) {
    this.entity = entity;
  }
}
