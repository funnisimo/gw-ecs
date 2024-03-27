import type { Entity } from "gw-ecs/entity";
import { Sprite } from "./sprite";

export class Name {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
