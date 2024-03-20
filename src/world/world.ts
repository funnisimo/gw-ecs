import { System } from "../system/system.js";
import { AddStepOpts, SystemManager } from "../system/manager.js";
import { Level } from "./level.js";

export interface WorldInit {
  worldInit?(world: World): void;
}

export class World extends Level {
  _systems: SystemManager;

  constructor() {
    super("world");
    this._systems = new SystemManager();
  }

  setUnique<T>(
    val: T & WorldInit,
    initFn?: (global: T, world: World) => void
  ): this {
    super.setUnique(val);
    const worldInit = val["worldInit"];
    if (worldInit) {
      worldInit.call(val, this);
    }
    if (initFn) {
      initFn(val, this);
    }
    return this;
  }

  // TODO - steps -> opts?: string[] | { runSet?: string, runStep?: string, runIf?: RunIfFn, enable?: boolean, steps?: string[] }
  addSystemSet(name: string, steps?: string[]): this {
    this._systems.addSet(name, steps);
    return this;
  }

  addSystemStep(set: string, step: string, opts?: AddStepOpts): World;
  addSystemStep(step: string, opts?: AddStepOpts): World;
  addSystemStep(
    ...args: [string, AddStepOpts?] | [string, string, AddStepOpts?]
  ): this {
    // @ts-ignore
    this._systems.addStep(...args);
    return this;
  }

  addSystem(system: System, enable?: boolean): World;
  addSystem(system: System, inStep: string, enable?: boolean): World;
  addSystem(
    system: System,
    inSet: string,
    inStep: string,
    enable?: boolean
  ): World;
  addSystem(system: System, ...args: any[]): this {
    this._systems.addSystem(system, ...args);
    return this;
  }

  init(fn: (world: World) => void): this {
    fn(this);
    return this;
  }

  start(): this {
    this._systems.start(this);
    return this;
  }

  runSystems(time?: number, delta: number = 0) {
    this.runSystemSet("default", time, delta);
  }

  runSystemSet(set: string, time?: number, delta: number = 0): void {
    if (time === undefined) {
      time = this.time;
      delta = this.delta;
    }
    this._systems.runSet(set, this, time, delta);
    // this.maintain();
  }

  addTime(delta: number): this {
    this.delta = delta;
    this.time += delta;
    return this;
  }

  rebase(zeroTick: number): void {
    super.rebase(zeroTick);
    this._systems.rebase(zeroTick);
  }
}
