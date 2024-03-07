import { World } from "../world/world.js";

export abstract class System {
  private _enabled: boolean = true;
  lastTick = 0; // not protected so that SystemManager can update on run

  constructor() {
    this._enabled = true;
  }

  start(_world: World) {}

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

  shouldRun(_world: World, _time: number, _delta: number): boolean {
    return this._enabled;
  }

  abstract run(world: World, time: number, delta: number): void;
}
