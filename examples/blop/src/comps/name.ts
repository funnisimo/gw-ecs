import type { Entity } from "gw-ecs/entity";
import { Sprite } from "./sprite";

export class Name {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export function coloredName(entity: Entity): string {
  let sprite = entity.fetch(Sprite) || { fg: "white" };
  let name = entity.fetch(Name);

  if (!name) return `#{${sprite.fg} Entity}`;

  // other items: powerup + heal + add dna slot + ...
  return `#{${sprite.fg} ${name.name}}`;
}
