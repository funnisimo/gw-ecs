import { Level } from "../world/level.js";

export type RunIfFn = (level: Level, time: number, delta: number) => boolean;

export class System {
  private _enabled: boolean = true;
  _runIf: RunIfFn; // TODO - allow multiple?  RunIfFn[]
  lastTick = 0; // not protected so that SystemManager can update on run

  constructor(runIf?: RunIfFn) {
    this._enabled = true;
    this._runIf = runIf || (() => true);
  }

  start(_level: Level) {}

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

  shouldRun(level: Level, time: number, delta: number): boolean {
    return this._enabled && this._runIf(level, time, delta);
  }

  run(_level: Level, _time: number, _delta: number): void {}
}

export type SystemFn = (level: Level, time: number, delta: number) => void;

export class FunctionSystem extends System {
  _fn: SystemFn;

  constructor(fn: SystemFn, runIf?: RunIfFn) {
    super(runIf);
    this._fn = fn;
  }

  run(level: Level, time: number, delta: number): void {
    this._fn(level, time, delta);
  }
}
