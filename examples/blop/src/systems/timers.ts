import { System } from "gw-ecs/system/system";
import type { World } from "gw-ecs/world";
import { Timers } from "gw-utils/app";
import { Game } from "../uniques";

export class TimerSystem extends System {
  constructor() {
    super();
  }

  run(world: World, time: number, delta: number): void {
    const timers = world.getUnique(Timers);
    timers.update(delta);

    const game = world.getUnique(Game);
    game.ready = timers.length == 0;
  }
}
