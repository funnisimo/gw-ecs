import { World, WorldInit } from "./world.js";
import { AnyComponent, Component } from "../component/component.js";
import { AnyCompStoreCtr, SetStore } from "../component/store.js";
import { AnyQueue, Queue } from "./queue.js";
import { Level } from "./level.js";
import { AnyResourceCtr, Resources } from "./resources.js";
import { Entity } from "../entity/entity.js";

// export interface Global<T> extends Function {
//   new (...args: any[]): T;
// }

// export type AnyGlobal = Global<any>;

// export type GlobalInitFn<T> = (global: T, world: World) => void;

// class GlobalData<T> {
//   data: T;
//   initFn?: GlobalInitFn<T>;

//   constructor(data: T, initFn?: GlobalInitFn<T>) {
//     this.data = data;
//     this.initFn = initFn;
//   }
// }

// type AnyGlobalData = GlobalData<any>;

// export class Globals {
//   _data: Map<AnyComponent, AnyGlobalData> = new Map();

//   set<T>(val: T, initFn?: GlobalInitFn<T>) {
//     const comp = (<any>val).constructor;
//     this._data.set(comp!, new GlobalData(val, initFn));
//   }

//   get<T>(comp: Component<T>): T {
//     const data = this._data.get(comp);
//     return data && data.data;
//   }

//   delete<T>(comp: Component<T>) {
//     this._data.delete(comp);
//   }
// }

class Levels {
  _levels: Map<string, Level>;
  _next: Level | null;
  _active!: Level;

  constructor() {
    this._levels = new Map();
    this._next = null;
  }

  get active(): Level {
    return this._active;
  }

  get length(): number {
    return this._levels.size;
  }

  get(id: string): Level {
    const level = this._levels.get(id);
    if (!level) throw new Error("Level not found: " + id);
    return level;
  }

  set(level: Level) {
    if (this._levels.has(level.id)) {
      console.warn("Replacing already existing level: " + level.id);
    }
    if (!this._active) {
      this._active = level;
    }
    this._levels.set(level.id, level);
  }

  forEach(fn: (level: Level) => void) {
    for (let level of this._levels.values()) {
      fn(level);
    }
  }

  activate(id: string | Level) {
    const level = typeof id === "string" ? this.get(id) : id;
    if (this._active && this._active.id === level.id) {
      return; // Reactivating same level.
    }
    if (this._next && this._next.id !== level.id) {
      console.warn(
        "Replacing level to be activated [" +
          this._next.id +
          "] with another [" +
          level.id +
          "]"
      );
    }
    this._next = level;
  }

  _updateActive(): boolean {
    if (!this._next) return false;
    this._active = this._next;
    this._next = null;
    return true;
  }

  moveEntityTo(entity: Entity, id: string | Level) {
    const newLevel = typeof id === "string" ? this.get(id) : id;
    this._active.removeEntity(entity);
    newLevel.addEntity(entity);
  }
}

export class MultiWorld extends World {
  _globals: Resources;
  _registeredComponents: Map<AnyComponent, AnyCompStoreCtr>;
  _registeredQueues: Set<AnyQueue>;
  _registeredUniques: Set<AnyResourceCtr>;
  _levels: Levels;
  _updateLevelSet: string;

  constructor() {
    super();
    this._globals = new Resources();
    this._registeredComponents = new Map();
    this._registeredQueues = new Set();
    this._registeredUniques = new Set();
    this._levels = new Levels();
    this._levels.set(this._level); // add 'default' level to levels

    this._globals.set(this._levels);
    this._updateLevelSet = "default";
  }

  init(fn: (world: MultiWorld) => void): this {
    fn(this);
    return this;
  }

  updateLevelsAfter(set: string): this {
    if (!this._systems.has(set)) {
      throw new Error(
        "Trying to update active level after non-existing system set: " + set
      );
    }
    this._updateLevelSet = set;
    return this;
  }

  ////////////////////////
  // GLOBALS

  setGlobal<T>(
    val: T & WorldInit,
    initFn?: (global: T, world: World) => void
  ): this {
    this._globals.set(val);
    const worldInit = val["worldInit"];
    if (worldInit) {
      worldInit.call(val, this);
    }
    if (initFn) {
      initFn(val, this);
    }
    return this;
  }

  getGlobal<T>(comp: Component<T>): T {
    return this._globals.get(comp);
  }

  removeGlobal<T>(comp: Component<T>) {
    this._globals.delete(comp);
  }

  ///////////////////////////////////
  // SYSTEMS

  runSystemSet(set: string, time?: number, delta: number = 0): void {
    if (time === undefined) {
      time = this.time;
      delta = this.delta;
    }
    this._systems.runSet(set, this, time, delta);

    // this.maintain();

    if (set === this._updateLevelSet && this._levels._updateActive()) {
      this._level = this._levels.active;
    }
  }

  ///////////////////////////////////
  // LEVELS

  addLevel(level: Level): this {
    this._levels.set(level);

    for (let [comp, ctr] of this._registeredComponents) {
      level.registerComponent(comp, ctr);
    }
    for (let comp of this._registeredQueues) {
      level.registerQueue(comp);
    }
    for (let cls of this._registeredUniques) {
      level.setUnique(new cls());
    }

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

  activateLevel(id: string): this {
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

  ///////////////////////////
  // REGISTER

  registerComponent<T>(comp: Component<T>, storeCls?: AnyCompStoreCtr): this {
    storeCls = storeCls || SetStore<T>;
    this._registeredComponents.set(comp, storeCls);
    this._levels.forEach((level) => {
      level.registerComponent(comp, storeCls);
    });
    return this;
  }

  registerComponents(...comp: AnyComponent[]): this {
    comp.forEach((c) => {
      this.registerComponent(c); // TODO - Is there a typescript trick to get T?
    });
    return this;
  }

  registerQueue<T>(comp: Queue<T>): this {
    this._registeredQueues.add(comp);
    this._levels.forEach((level) => {
      level.registerQueue(comp);
    });
    return this;
  }

  registerUnique<T>(uniqueCls: AnyResourceCtr): this {
    this._registeredUniques.add(uniqueCls);
    this._levels.forEach((level) => {
      level.setUnique(new uniqueCls());
    });
    return this;
  }
}
