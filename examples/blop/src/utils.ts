import type { Entity } from "gw-ecs/entity";
import { Name, Sprite } from "./comps";
import { clamp } from "gw-utils/utils";

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

export function quadInOut(input: number): number {
  input = clamp(input, 0, 1) * 2;

  if (input < 1) {
    return (input * input) / 2;
  } else {
    input -= 1;
    return -0.5 * ((input - 2) * input - 1);
  }
}

export function cubicOut(input: number): number {
  input -= 1;
  return input * input * input + 1;
}
