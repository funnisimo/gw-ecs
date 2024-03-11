import { World, WorldInit } from "./world.js";

import { AnyComponent, Component } from "../component/component.js";
import { AnyCompStoreCtr, SetStore } from "../component/store.js";
import { AnyQueue, Queue } from "../utils/queue.js";
import { AddStepOpts, SystemManager } from "../system/manager.js";
import { System } from "../system/system.js";
import { SystemFn } from "../system/functionSystem.js";
import { Level } from "./level.js";

export interface Global<T> extends Function {
  new (...args: any[]): T;
}

export type AnyGlobal = Global<any>;

export type GlobalInitFn<T> = (global: T, world: World) => void;

class GlobalData<T> {
  data: T;
  initFn?: GlobalInitFn<T>;

  constructor(data: T, initFn?: GlobalInitFn<T>) {
    this.data = data;
    this.initFn = initFn;
  }
}

type AnyGlobalData = GlobalData<any>;

export class Globals {
  _data: Map<AnyComponent, AnyGlobalData> = new Map();

  set<T>(val: T, initFn?: GlobalInitFn<T>) {
    const comp = (<any>val).constructor;
    this._data.set(comp!, new GlobalData(val, initFn));
  }

  get<T>(comp: Component<T>): T {
    const data = this._data.get(comp);
    return data && data.data;
  }

  delete<T>(comp: Component<T>) {
    this._data.delete(comp);
  }
}

export class MultiWorld {
  _globals: Globals;
  _components: Map<AnyComponent, AnyCompStoreCtr>;
  _queues: Set<AnyQueue>;
  _systems: SystemManager;
  _levels: Map<string, Level>;
  _level!: Level;

  constructor() {
    this._globals = new Globals();
    this._components = new Map();
    this._queues = new Set();
    this._systems = new SystemManager();
    this._levels = new Map();
  }

  ////////////////////////
  // GLOBALS

  setGlobal<T>(val: T & WorldInit, initFn?: GlobalInitFn<T>): this {
    this._globals.set(val, initFn);
    return this;
  }

  getGlobal<T>(comp: Global<T>): T {
    return this._globals.get(comp);
  }

  removeGlobal<T>(comp: Global<T>) {
    this._globals.delete(comp);
  }

  ///////////////////////////
  // REGISTER

  registerComponent<T>(comp: Component<T>, store?: AnyCompStoreCtr): this {
    store = store || SetStore<T>;
    this._components.set(comp, store);
    for (let level of this._levels.values()) {
      level.registerComponent(comp, new store(comp));
    }
    return this;
  }

  registerComponents(...comp: AnyComponent[]): this {
    comp.forEach((c) => {
      this.registerComponent(c); // TODO - Is there a typescript trick to get T?
    });
    return this;
  }

  registerQueue<T>(comp: Queue<T>): this {
    this._queues.add(comp);
    for (let level of this._levels.values()) {
      level.registerQueue(comp);
    }
    return this;
  }

  addSystemSet(name: string, steps?: string[]): this {
    this._systems.addSet(name, steps);
    return this;
  }

  addSystemStep(set: string, step: string, opts?: AddStepOpts): this;
  addSystemStep(step: string, opts?: AddStepOpts): this;
  addSystemStep(
    ...args: [string, AddStepOpts?] | [string, string, AddStepOpts?]
  ): this {
    // @ts-ignore
    this._systems.addStep(...args);
    return this;
  }

  addSystem(system: System | SystemFn, enabled?: boolean): this;
  addSystem(system: System | SystemFn, inStep: string, enabled?: boolean): this;
  addSystem(
    system: System,
    inSet: string,
    inStep: string,
    enabled?: boolean
  ): this;
  addSystem(system: System | SystemFn, ...args: any[]): this {
    this._systems.addSystem(system, ...args);
    return this;
  }

  runSystems(time?: number, delta: number = 0) {
    this.runSystemSet("default", time, delta);
  }

  runSystemSet(set: string, time?: number, delta: number = 0): void {
    if (!this._level)
      throw new Error("No level set - did you forget to call 'useLevel(...)'?");
    if (time === undefined) {
      time = this._level.time;
      delta = this._level.delta;
    }
    this._systems.runSet(set, this._level, time, delta);
    // this._level.maintain();
  }

  ///////////////////////////////////
  // LEVELS

  addLevel(level: Level): this {
    if (this._levels.size == 0) {
      this._level = level;
    }
    this._levels.set(level.id, level);

    for (let [comp, ctr] of this._components) {
      level.registerComponent(comp, new ctr(comp));
    }
    for (let comp of this._queues) {
      level.registerQueue(comp);
    }

    // TODO - set globals
    return this;
  }

  createLevel(id: string, fn: (level: Level) => void): this {
    const level = new Level(id);
    this.addLevel(level);
    fn(level);
    return this;
  }

  addLevels(...levels: Level[]): this {
    levels.forEach((l) => this.addLevel(l));
    return this;
  }

  useLevel(id: string): this {
    this._level = this._levels.get(id)!;
    if (!this._level) throw new Error("Could not find level: " + id);
    return this;
  }

  getLevel(id: string): Level | undefined {
    const level = this._levels.get(id);
    return level;
  }

  get level(): Level {
    return this._level;
  }
}
