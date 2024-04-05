import { QueueSystem, type RunIfFn } from "gw-ecs/system";
import { GameEvent } from "../queues";
import type { Bundle, Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { Hero } from "../comps";
import { Random, random } from "gw-utils/rng";
import * as Constants from "../constants";
import { Pos, PosManager } from "gw-ecs/common";
import { createRandomTrigger } from "../dnaTriggers";
import { createRandomEffect } from "../dnaEffects";
import { Game, Log } from "../uniques";
import { coloredName } from "../utils";
import { findDropPosNear } from "../map/utils";
import type { XY } from "gw-utils";
import { MapChanged } from "../triggers";

export class DropSystem extends QueueSystem<GameEvent> {
  constructor(runIf?: RunIfFn) {
    super(GameEvent, runIf);
  }

  runQueueItem(
    world: World,
    event: GameEvent,
    time: number,
    delta: number
  ): void {
    if (event.type === "kill") {
      if (event.target!.has(Hero)) return;

      const posMgr = world.getUnique(PosManager);
      let pos: XY | undefined = event.target!.fetch(Pos);
      // To ensure we drop near
      pos = findDropPosNear(world, pos!);
      if (!pos) return;

      const rng = world.getUnique(Random) || random;
      if (rng.chance(Constants.BLOP_DROP_CHANCE)) {
        if (rng.chance(50)) {
          // Trigger
          const entity = createRandomTrigger(world, rng);
          posMgr.set(entity, pos.x, pos.y);
          world
            .getUnique(Log)
            .add(
              `${coloredName(event.target!)} drops an ${coloredName(entity)}.`
            );
        } else {
          // Effect
          const entity = createRandomEffect(world, rng);
          posMgr.set(entity, pos.x, pos.y);
          world
            .getUnique(Log)
            .add(
              `${coloredName(event.target!)} drops an ${coloredName(entity)}.`
            );
        }

        // Need to update UI
        world.emitTrigger(new MapChanged());
        world.getUnique(Game).changed = true;
      }
    }
  }
}