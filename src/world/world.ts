import { System } from "../system/system.js";
import {
  EntitySystemStep,
  SystemManager,
  SystemStep,
  EntitySystemFn,
  SystemFn,
  EntitySystem,
} from "../system/index.js";
import { Level } from "./level.js";
import {
  AddStepOpts,
  EntitySystemSet,
  SystemSet,
} from "../system/systemSet.js";

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

  addSystemSet(
    name: string,
    steps?: string[] | SystemSet | EntitySystemSet,
    init?: (set: SystemSet | EntitySystemSet) => void
  ): this {
    this._systems.addSet(name, steps);
    if (init) {
      init(this._systems.getSet(name)!);
    }
    return this;
  }

  addSystemStep(
    set: string,
    step: string,
    opts?: AddStepOpts | SystemStep | EntitySystemStep
  ): World;
  addSystemStep(
    step: string,
    opts?: AddStepOpts | SystemStep | EntitySystemStep
  ): World;
  addSystemStep(
    ...args:
      | [string, (AddStepOpts | SystemStep | EntitySystemStep)?]
      | [string, string, (AddStepOpts | SystemStep | EntitySystemStep)?]
  ): this {
    // @ts-ignore
    this._systems.addStep(...args);
    return this;
  }

  addSystem(
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enable?: boolean
  ): World;
  addSystem(
    inStep: string,
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enable?: boolean
  ): World;
  addSystem(
    inSet: string,
    inStep: string,
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enable?: boolean
  ): World;
  addSystem(
    ...args:
      | [System | SystemFn | EntitySystem | EntitySystemFn, boolean?]
      | [string, System | SystemFn | EntitySystem | EntitySystemFn, boolean?]
      | [
          string,
          string,
          System | SystemFn | EntitySystem | EntitySystemFn,
          boolean?
        ]
  ): this {
    // @ts-ignore
    this._systems.addSystem(...args);
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

  getSystemSet(name: string): SystemSet | EntitySystemSet | undefined {
    return this._systems.getSet(name);
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
