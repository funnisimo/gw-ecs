import type { Entity } from "gw-ecs/entity";
import type { World, WorldInit } from "gw-ecs/world";
import { type XY } from "gw-utils";
import { Random, random } from "gw-utils/rng";

export class Game implements WorldInit {
  hero: Entity | null;
  depth: number;
  changed: boolean;
  ready: boolean;
  over: boolean;
  seed: number;

  constructor() {
    this.hero = null;
    this.depth = 0;
    this.changed = true;
    this.ready = true;
    this.over = false;
    this.seed = 0;
  }

  worldInit(world: World): void {
    this.seed = random.int();
    console.log("SEED", this.seed);
    world.setUnique(new Random(this.seed));
  }
}
