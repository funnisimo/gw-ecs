import { Entity } from "../entity/entity.js";
import { World } from "../world/world.js";

export type RunIfFn = (
  world: World,
  time: number,
  delta: number,
  lastTick: number
) => boolean;

export class System {
  private _enabled: boolean = true;
  _runIf: RunIfFn; // TODO - allow multiple?  RunIfFn[]
  lastTick = 0; // not protected so that SystemManager can update on run

  constructor(runIf?: RunIfFn) {
    this._enabled = true;
    this._runIf = runIf || (() => true);
  }

  start(world: World) {}

  rebase(zeroTime: number) {
    this.lastTick = Math.max(0, this.lastTick - zeroTime);
  }

  setEnabled(enable: boolean): this {
    this._enabled = enable;
    return this;
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  runIf(fn: RunIfFn): this {
    this._runIf = fn;
    return this;
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    return this._enabled && this._runIf(world, time, delta, this.lastTick);
  }

  run(world: World, time: number, delta: number): void {}
  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    return this.run(world, time, delta);
  }
  runQueueItem(world: World, item: any, time: number, delta: number): void {
    return this.run(world, time, delta);
  }
}

export type SystemFn = (world: World, time: number, delta: number) => void;

export class FunctionSystem extends System {
  _fn: SystemFn;

  constructor(fn: SystemFn, runIf?: RunIfFn) {
    super(runIf);
    this._fn = fn;
  }

  run(world: World, time: number, delta: number): void {
    this._fn(world, time, delta);
  }
}
