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
import {
  ComponentSource,
  Entities,
  Entity,
  EntityWatcher,
} from "../entity/entity.js";
import { Queue, QueueReader, QueueStore } from "./queue.js";
import { Resources } from "./resources.js";
import { AnyComponent, Component } from "../component/component.js";
import { AnyCompStoreCtr, CompStore } from "../component/store.js";

export interface WorldInit {
  worldInit?(world: World): void;
}

class WorldEntityWatcher implements EntityWatcher {
  world: World;

  constructor(world: World) {
    this.world = world;
  }

  entityCreated(entity: Entity): void {
    this.world.level.addEntity(entity);
  }

  entityDestroyed(entity: Entity): void {
    this.world.level.removeEntity(entity);
  }
}

class WorldComponentSource implements ComponentSource {
  world: World;

  constructor(world: World) {
    this.world = world;
  }
  get tick(): number {
    return this.world.tick;
  }

  setComponent<T>(
    entity: Entity,
    val: T,
    comp?: Component<T> | undefined
  ): void {
    // @ts-ignore
    comp = comp || val.constructor;
    if (!comp) throw new Error("Missing constructor!");
    const mgr = this.world.level.getStore(comp);
    if (!mgr) throw new Error("Using unregistered component: " + comp.name);
    mgr.set(entity, val);
  }

  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this.world.level.getStore(comp);
    return mgr && mgr.remove(entity);
  }
}

export class World {
  _systems: SystemManager;
  _level: Level;
  _entities: Entities;
  _toDestroy: Entity[];

  // TODO - Move to World
  _delta: number;
  _time: number;
  _currentTick: number;

  constructor() {
    this._level = new Level("world");
    this._systems = new SystemManager();
    this._entities = new Entities(new WorldComponentSource(this));
    this._entities.notify(new WorldEntityWatcher(this));
    this._delta = 0;
    this._time = 0;
    this._currentTick = 1;
    this._toDestroy = [];
  }

  get id(): string {
    return this._level.id;
  }
  get level(): Level {
    return this._level;
  }

  get time(): number {
    return this._time;
  }
  get delta(): number {
    return this._delta;
  }
  get tick(): number {
    return this._currentTick;
  }

  addTime(delta: number): this {
    this._delta = delta;
    this._time += delta;
    return this;
  }

  maintain(): number {
    let tick = this._currentTick;
    this._currentTick += 1; // Tick for each system (must be after)
    if (this._toDestroy.length) {
      //   this._toDestroy.forEach((entity) => {
      //     this.notify.forEach((n) => n.destroyEntity(entity));
      //   });
      // this._systems.forEach((system) =>
      //   system.destroyEntities(this._toDestroy)
      // );
      //   this._components.destroyEntities(this._toDestroy);
      this._entities.destroyEntities(this._toDestroy);
      this._toDestroy = [];

      this._currentTick += 1; // Tick for destroy
    }

    const zeroTick = 100000;
    if (tick >= zeroTick) {
      this._currentTick -= zeroTick;
      this._entities.rebase(zeroTick);
      this._systems.rebase(zeroTick);
      tick -= zeroTick;
    }
    return tick;
  }

  init(fn: (world: World) => void): this {
    fn(this);
    return this;
  }

  start(): this {
    this._systems.start(this);
    return this;
  }

  /////////////////////////////////////
  // SYSTEMS

  addSystemSet(
    name: string | SystemSet | EntitySystemSet,
    init?: (set: SystemSet) => void
  ): this {
    // @ts-ignore
    const set = this._systems.addSet(name);
    if (init) {
      init(set);
    }
    return this;
  }

  addSystemStep(
    set: string,
    step: string | SystemStep | EntitySystemStep,
    opts?: AddStepOpts
  ): World;
  addSystemStep(
    step: string | SystemStep | EntitySystemStep,
    opts?: AddStepOpts
  ): World;
  addSystemStep(
    ...args:
      | [string | SystemStep | EntitySystemStep, AddStepOpts?]
      | [string, string | SystemStep | EntitySystemStep, AddStepOpts?]
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

  ///////////////////////////////////////
  // QUEUE

  registerQueue<T>(comp: Queue<T>): this {
    this._level.registerQueue(comp);
    return this;
  }

  getQueue<T>(queue: Queue<T>): QueueStore<T> {
    const store = this._level._queues.getStore(queue);
    if (!store) throw new Error("Failed to find queue store: " + queue.name);
    return store;
  }

  getReader<T>(queue: Queue<T>, onlyNew = false): QueueReader<T> {
    const store = this._level._queues.getStore(queue);
    if (!store) throw new Error("Failed to find queue: " + queue.name);
    return store.reader(onlyNew);
  }

  pushQueue<T>(val: T, comp?: Queue<T>) {
    // @ts-ignore
    comp = comp || val.constructor;
    const queue = this.getQueue(comp!);
    queue.push(val);
  }

  ////////////

  entities(): Entities {
    return this._entities;
  }

  create(...withComps: any[]): Entity {
    const entity = this._entities.create();
    withComps.forEach((c) => {
      entity.set(c);
    });
    return entity;
  }

  destroyLater(entity: Entity): void {
    // this._entities.queueDestroy(entity);
    this._toDestroy.push(entity);
  }

  destroyNow(entity: Entity): void {
    // this._components.destroyEntity(entity);
    this._entities.destroy(entity);
    // entity._destroy();
  }

  /// Resources

  setUnique<T>(
    val: T & WorldInit,
    initFn?: (unique: T, world: World) => void
  ): this {
    this._level.setUnique(val);
    const worldInit = val["worldInit"];
    if (worldInit) {
      worldInit.call(val, this);
    }
    if (initFn) {
      initFn(val, this);
    }
    return this;
  }

  uniques(): Resources {
    return this._level.uniques();
  }

  getUnique<T>(comp: Component<T>): T {
    return this._level.getUnique(comp);
  }

  getUniqueOr<T>(comp: Component<T>, fn: () => T): T {
    return this._level.getUniqueOr(comp, fn);
  }

  removeUnique<T>(comp: Component<T>) {
    this._level.removeUnique(comp);
  }

  /// ComponentSource

  registerComponent<T>(comp: Component<T>, storeCls?: AnyCompStoreCtr): this {
    this._level.registerComponent(comp, storeCls);
    return this;
  }

  registerComponents(...comp: AnyComponent[]): this {
    comp.forEach((c) => {
      this.registerComponent(c);
    });
    return this;
  }

  getStore<T>(comp: Component<T>): CompStore<T> {
    return this._level.getStore(comp);
  }

  ///////////////////////////
}
