import { World } from "../world/world.js";

export abstract class System {
  private _enabled: boolean = true;
  protected lastTick = 0;

  constructor() {
    this._enabled = true;
  }

  start(_world: World) {}

  rebase(zeroTime: number) {
    this.lastTick = Math.max(0, this.lastTick - zeroTime);
  }

  setEnabled(enable: boolean) {
    this._enabled = enable;
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  shouldRun(_world: World, _time: number, _delta: number): boolean {
    return this._enabled;
  }

  // TODO - params? => time: number, delta: number, currentTick: number
  run(world: World, time: number, delta: number): void {
    if (!this.shouldRun(world, time, delta)) {
      return;
    }
    this.process(world, time, delta);
    this.lastTick = world.currentTick();
  }

  protected abstract process(world: World, time: number, delta: number): void;
}
