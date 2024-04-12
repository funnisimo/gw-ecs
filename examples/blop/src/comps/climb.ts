import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { Action } from "./action";
import { Pos, PosManager } from "gw-ecs/common";
import { gotoNextLevel } from "../world";
import { STAIRS_ASPECT } from "../tiles";
import { TravelTo } from "./travel";
import { takeTurn } from "./actor";
import { Blop } from "./blop";
import { nextLevel } from "../map/nextLevel";

export class Climb extends Action {
  constructor() {
    super();
  }

  act(world: World, actor: Entity): void {
    const posMgr = world.getUnique(PosManager);
    const pos = actor.fetch(Pos)!;

    if (posMgr.hasAt(pos.x, pos.y, STAIRS_ASPECT)) {
      // TODO - prompt - do you want to take the stairs?
      //      - default - 'yes'

      takeTurn(world, actor);

      // Heal actor - on Trigger - NextLevel
      const blop = actor.fetch(Blop)!;
      blop.health = blop.maxHealth;

      // TODO - Trigger - NextLevel(depth + 1)
      nextLevel(world);
    }
  }
}
