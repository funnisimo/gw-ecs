import { Level } from "../world/level.js";

export abstract class System {
  private _enabled: boolean = true;
  lastTick = 0; // not protected so that SystemManager can update on run

  constructor() {
    this._enabled = true;
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

  shouldRun(_level: Level, _time: number, _delta: number): boolean {
    return this._enabled;
  }

  abstract run(level: Level, time: number, delta: number): void;
}
