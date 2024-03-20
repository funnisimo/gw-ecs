import { System } from "gw-ecs/system/system";
import type { Level } from "gw-ecs/world";
import { Timers } from "gw-utils/app";
import { Game } from "../uniques";

export class TimerSystem extends System {
  constructor() {
    super();
  }

  run(level: Level, time: number, delta: number): void {
    const timers = level.getUnique(Timers);
    timers.update(delta);

    const game = level.getUnique(Game);
    game.ready = timers.length == 0;
  }
}
