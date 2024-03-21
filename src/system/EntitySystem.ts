import { Aspect } from "../world/aspect.js";
import { RunIfFn, System } from "./system.js";
import { Entity } from "../entity/entity.js";
import { Level } from "../world/level.js";

export class EntitySystem extends System {
  _aspect: Aspect;

  constructor(aspect: Aspect, runIf?: RunIfFn) {
    super(runIf);
    this._aspect = aspect;
  }

  accept(entity: Entity): boolean {
    return this._aspect.match(entity, this.lastTick);
  }

  run(level: Level, time: number, delta: number): void {
    for (let e of this._aspect.all(level, this.lastTick)) {
      this.processEntity(level, e, time, delta);
    }
  }

  processEntity(
    _level: Level,
    _entity: Entity,
    _time: number,
    _delta: number
  ): void {}
}

export type EntitySystemFn = (
  level: Level,
  entity: Entity,
  time: number,
  delta: number
) => void;

export class EntityFunctionSystem extends EntitySystem {
  _fn: EntitySystemFn;

  constructor(fn: EntitySystemFn, runIf?: RunIfFn) {
    super(new Aspect(), runIf);
    this._fn = fn;
  }

  processEntity(
    level: Level,
    entity: Entity,
    time: number,
    delta: number
  ): void {
    this._fn(level, entity, time, delta);
  }
}
