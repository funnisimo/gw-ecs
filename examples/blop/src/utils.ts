import type { Entity } from "gw-ecs/entity";
import { Name, Sprite } from "./comps";

const SQRT_2_PI = Math.sqrt(2 * Math.PI);
// https://www.math.net/gaussian-distribution
export function gaussian(mu: number, stddev: number, x: number): number {
  return (
    (1 / (stddev * SQRT_2_PI)) *
    Math.exp(-Math.pow(x - mu, 2) / (2 * stddev * stddev))
  );
}

export function coloredName(entity: Entity): string {
  let sprite = entity.fetch(Sprite) || { fg: "white" };
  let name = entity.fetch(Name);

  if (!name) return `#{${sprite.fg} Entity}`;

  // other items: powerup + heal + add dna slot + ...
  return `#{${sprite.fg} ${name.name}}`;
}
