import type { Entity } from "gw-ecs/entity";
import type { Loc, XY } from "gw-utils";
import type { Pos } from "gw-ecs/common";

export type GameEventType = "wait" | "move" | "turn" | "attack" | "kill";

export interface GameEventOpts {
  dir?: Loc;
  pos?: Pos;
  target?: Entity;
  time?: number;
  damage?: number;
}

export class GameEvent {
  type: GameEventType;
  entity: Entity;
  dir?: Loc;
  pos?: Pos;
  target?: Entity;
  time: number;
  damage: number;

  constructor(entity: Entity, type: GameEventType, opts: GameEventOpts = {}) {
    this.entity = entity;
    this.type = type;
    this.dir = opts.dir;
    this.target = opts.target;
    this.pos = opts.pos;
    this.time = opts.time || 0;
    this.damage = opts.damage || 0;
  }
}
