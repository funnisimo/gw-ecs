import { Aspect } from "../world/aspect.js";
import { RunIfFn, System } from "./system.js";
import { Entity } from "../entity/entity.js";
import { Level } from "../world/level.js";

export class EntitySystem extends System {
  _aspect: Aspect;

  constructor(aspect?: Aspect, runIf?: RunIfFn) {
    super(runIf);
    this._aspect = aspect || new Aspect();
  }

  accept(entity: Entity): boolean {
    return this._aspect.match(entity, this.lastTick);
  }

  run(level: Level, time: number, delta: number): void {
    for (let e of this._aspect.all(level, this.lastTick)) {
      this.runEntity(level, e, time, delta);
    }
  }

  runEntity(level: Level, entity: Entity, time: number, delta: number): void {}
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

  runEntity(level: Level, entity: Entity, time: number, delta: number): void {
    this._fn(level, entity, time, delta);
  }
}
