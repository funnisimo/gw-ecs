import { Entity } from "../entity/entity.js";
import { Aspect } from "../world/aspect.js";
import { World } from "../world/world.js";
import { EntitySystem } from "./entitySystem.js";
import { System } from "./system.js";

export type SystemFn = (world: World, time: number, delta: number) => void;
export type EntitySystemFn = (
  world: World,
  entity: Entity,
  time: number,
  delta: number
) => void;
export type RunIfFn = (world: World, time: number, delta: number) => boolean;

export class FunctionSystem extends System {
  _fn: SystemFn;
  _runIf: RunIfFn; // TODO - allow multiple?  RunIfFn[]

  constructor(fn: SystemFn, runIf?: RunIfFn) {
    super();
    this._fn = fn;
    this._runIf = runIf || (() => true);
  }

  runIf(fn: RunIfFn): FunctionSystem {
    this._runIf = fn;
    return this;
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    return (
      super.shouldRun(world, time, delta) && this._runIf(world, time, delta)
    );
  }

  run(world: World, time: number, delta: number): void {
    this._fn(world, time, delta);
  }
}

export class EntityFunctionSystem extends EntitySystem {
  _fn: EntitySystemFn;
  _runIf: RunIfFn; // TODO - allow multiple?  RunIfFn[]

  constructor(fn: EntitySystemFn, runIf?: RunIfFn) {
    super(new Aspect());
    this._fn = fn;
    this._runIf = runIf || (() => true);
  }

  runIf(fn: RunIfFn): this {
    this._runIf = fn;
    return this;
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    return (
      super.shouldRun(world, time, delta) && this._runIf(world, time, delta)
    );
  }

  processEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): void {
    this._fn(world, entity, time, delta);
  }
}
