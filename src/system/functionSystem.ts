import { World } from "../world";
import { System } from "./system";

export type SystemFn = (world: World, time: number, delta: number) => void;
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

  protected process(world: World, time: number, delta: number): void {
    this._fn(world, time, delta);
  }
}
