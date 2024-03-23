import { Aspect } from "../world/aspect.js";
import { RunIfFn, System } from "./system.js";
import { Entity } from "../entity/entity.js";
import { World } from "../world/world.js";

export class EntitySystem extends System {
  _aspect: Aspect;

  constructor(aspect?: Aspect, runIf?: RunIfFn) {
    super(runIf);
    this._aspect = aspect || new Aspect();
  }

  accept(entity: Entity): boolean {
    return this._aspect.match(entity, this.lastTick);
  }

  run(world: World, time: number, delta: number): void {
    for (let e of this._aspect.active(world, this.lastTick)) {
      this.runEntity(world, e, time, delta);
    }
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {}
}

export type EntitySystemFn = (
  world: World,
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

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    this._fn(world, entity, time, delta);
  }
}
