import { QueueSystem, type RunIfFn } from "gw-ecs/system";
import { GameEvent } from "../queues";
import type { World } from "gw-ecs/world";
import { Game, Log } from "../uniques";
import { Schedule } from "gw-ecs/common";
import { coloredName } from "../utils";

export class GameOverSystem extends QueueSystem<GameEvent> {
  constructor(runIf?: RunIfFn) {
    super(GameEvent, runIf);
  }

  runQueueItem(
    world: World,
    item: GameEvent,
    time: number,
    delta: number
  ): void {
    if (item.type === "kill") {
      const game = world.getUnique(Game);
      if (item.target === game.hero) {
        world.getUnique(Log).add("#{red GAME OVER}");
        game.over = true;
        // TODO - Restart?
      }
    }
  }
}
