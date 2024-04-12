import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { Action } from "./action";
import { GameEvent } from "../queues";
import { takeTurn } from "./actor";

export class Wait extends Action {
  queueGameEvent: boolean;

  constructor(queueGameEvent = true) {
    super();
    this.queueGameEvent = queueGameEvent;
  }

  act(world: World, actor: Entity): void {
    if (this.queueGameEvent) {
      world.pushQueue(new GameEvent(actor, "wait"));
    }
    takeTurn(world, actor);
  }
}

export class TakeTurn extends Wait {
  constructor() {
    super(false);
  }
}
