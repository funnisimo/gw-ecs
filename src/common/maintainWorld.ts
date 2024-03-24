import { System } from "../system";
import { World } from "../world";

export class MaintainWorld extends System {
  run(world: World, time: number, delta: number): void {
    world.maintain();
  }
}
