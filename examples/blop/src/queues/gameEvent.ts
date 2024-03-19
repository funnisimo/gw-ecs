import type { Entity } from "gw-ecs/entity/entity";
import type { Loc } from "gw-utils";

export type GameEventType = "wait" | "move" | "turn";

export interface GameEventOpts {
  dir?: Loc;
  target?: Entity;
}

export class GameEvent {
  type: GameEventType;
  entity: Entity;
  dir: Loc | undefined;
  target: Entity | undefined;

  constructor(entity: Entity, type: GameEventType, opts: GameEventOpts = {}) {
    this.entity = entity;
    this.type = type;
    this.dir = opts.dir;
    this.target = opts.target;
  }
}
