import type { Entity } from "gw-ecs/entity";
import type { Loc, XY } from "gw-utils";
import type { Pos } from "gw-ecs/common";

export type GameEventType = "wait" | "move" | "turn";

export interface GameEventOpts {
  dir?: Loc;
  pos?: Pos;
  target?: Entity;
}

export class GameEvent {
  type: GameEventType;
  entity: Entity;
  dir?: Loc;
  pos?: Pos;
  target?: Entity;

  constructor(entity: Entity, type: GameEventType, opts: GameEventOpts = {}) {
    this.entity = entity;
    this.type = type;
    this.dir = opts.dir;
    this.target = opts.target;
    this.pos = opts.pos;
  }
}
