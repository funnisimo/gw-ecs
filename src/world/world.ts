import {
  SystemManager,
  AnySystemSet,
  AnySystem,
  AnySystemStep,
} from "../system/index.js";
import { Level } from "./level.js";
import { AddStepOpts } from "../system/systemSet.js";
import {
  ComponentSource,
  WorldEntities,
  Entity,
  EntityWatcher,
} from "../entity/entity.js";
import { Queue, QueueReader, QueueStore } from "./queue.js";
import { Resources } from "./resources.js";
import { AnyComponent, Component } from "../component/component.js";
import { AnyCompStoreCtr, CompStore } from "../component/store.js";
import { AnyComponentArg, Bundle } from "../entity/bundle.js";
import { TriggerHandler, TriggerHandlerFn, TriggerManager } from "./trigger.js";

export interface WorldInit {
  worldInit?(world: World): void;
}

const ZERO_TICK = 100000;

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

  getTick(): number {
    return this.world._currentTick;
  }

  setComponent<T>(
    entity: Entity,
    val: T,
    comp?: Component<T> | undefined
  ): void {
    comp = comp || ((<Object>val).constructor as Component<T>);
    if (!comp) throw new Error("Missing constructor!");
    const mgr = this.world.level.getStore(comp);
    if (!mgr) throw new Error("Using unregistered component: " + comp.name);
    mgr.set(entity, val, this.world._currentTick);
  }

  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this.world.level.getStore(comp);
    return mgr && mgr.remove(entity, this.world._currentTick);
  }
}

export class World {
  _globals: Resources;
  _systems: SystemManager;
  _level: Level;
  _entities: WorldEntities;
  _toDestroy: Entity[];
  _triggers: TriggerManager;

  // TODO - Move to World
  _delta: number;
  _time: number;
  _currentTick: number;

  constructor(globals?: Resources) {
    this._level = new Level("world");
    this._globals = globals || new Resources();
    this._systems = new SystemManager();
    this._triggers = new TriggerManager();
    this._entities = new WorldEntities(new WorldComponentSource(this));
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

  addTime(delta: number): this {
    this._delta = delta;
    this._time += delta;
    return this;
  }

  tick(): number {
    let tick = this._currentTick;
    this._currentTick += 1; // Tick for each system (must be after)
    return tick;
  }

  maintain() {
    this._level.maintain();

    // TODO - allow delayed events for most things (add/remove entity,component, queue, emit)
    if (this._toDestroy.length) {
      //   this._toDestroy.forEach((entity) => {
      //     this.notify.forEach((n) => n.destroyEntity(entity));
      //   });
      // this._systems.forEach((system) =>
      //   system.destroyEntities(this._toDestroy)
      // );
      //   this._components.destroyEntities(this._toDestroy);

      this._toDestroy.forEach((entity) => {
        this._level._components.entityDestroyed(entity);
      });
      this._entities.destroyEntities(this._toDestroy);
      this._toDestroy = [];

      this._currentTick += 1; // Tick for destroy
    }
  }

  init(fn: (world: World) => void): this {
    fn(this);
    return this;
  }

  start(): this {
    this._systems.start(this);
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

  getGlobalOr<T>(comp: Component<T>, fn: () => T & WorldInit): T {
    const v = this.getGlobal(comp);
    if (v !== undefined) {
      return v;
    }
    const newV = fn();
    this.setGlobal(newV);
    return newV;
  }

  removeGlobal<T>(comp: Component<T>) {
    this._globals.delete(comp);
  }

  /////////////////////////////////////
  // SYSTEMS

  addSystemSet(
    name: string | AnySystemSet,
    init?: (set: AnySystemSet) => void
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
    step: string | AnySystemStep,
    opts?: AddStepOpts
  ): World;
  addSystemStep(step: string | AnySystemStep, opts?: AddStepOpts): World;
  addSystemStep(
    ...args:
      | [string | AnySystemStep, AddStepOpts?]
      | [string, string | AnySystemStep, AddStepOpts?]
  ): this {
    // @ts-ignore
    this._systems.addStep(...args);
    return this;
  }

  addSystem(system: AnySystem, enable?: boolean): World;
  addSystem(inStep: string, system: AnySystem, enable?: boolean): World;
  addSystem(
    inSet: string,
    inStep: string,
    system: AnySystem,
    enable?: boolean
  ): World;
  addSystem(
    ...args:
      | [AnySystem, boolean?]
      | [string, AnySystem, boolean?]
      | [string, string, AnySystem, boolean?]
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

    if (this._currentTick >= ZERO_TICK) {
      this._currentTick -= ZERO_TICK;
      this._entities.rebase(ZERO_TICK);
      this._systems.rebase(ZERO_TICK);
      this._currentTick -= ZERO_TICK;
    }
  }

  getSystemSet(name: string): AnySystemSet | undefined {
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

  pushQueue<T>(val: T, comp?: Queue<T>): T {
    // @ts-ignore
    comp = comp || val.constructor;
    const queue = this.getQueue(comp!);
    queue.push(val);
    return val;
  }

  ///////////////////////
  // TRIGGERS

  registerTrigger<T>(component: Component<T>, steps?: string[]): this {
    this._triggers.register(component, steps);
    return this;
  }

  addTriggerStep<T>(
    component: Component<T>,
    step: string,
    opts: AddStepOpts = {}
  ): this {
    this._triggers.addStep(component, step, opts);
    return this;
  }

  addTrigger<T>(
    component: Component<T>,
    handler: TriggerHandler<T> | TriggerHandlerFn<T>
  ): this;
  addTrigger<T>(
    component: Component<T>,
    step: string,
    handler: TriggerHandler<T> | TriggerHandlerFn<T>
  ): this;
  addTrigger<T>(component: Component<T>, ...args: any[]): this {
    if (args.length == 1) {
      this._triggers.addHandler(component, args[0]);
    } else {
      this._triggers.addHandler(component, args[0], args[1]);
    }
    return this;
  }

  emitTrigger<T>(component: T, time?: number) {
    if (time === undefined) {
      time = this.time;
    }
    this._triggers.emit(this, component, time);
  }

  ////////////

  entities(): WorldEntities {
    return this._entities;
  }
  create(bundle: Bundle, ...extraComps: AnyComponentArg[]): Entity;
  create(...withComps: AnyComponentArg[]): Entity;
  create(...withComps: AnyComponentArg[]): Entity {
    let entity: Entity;
    if (withComps[0] instanceof Bundle) {
      const bundle: Bundle = withComps.shift();
      entity = bundle.create(this);
    } else {
      entity = this._entities.create();
    }

    for (let c of withComps) {
      if (typeof c === "function") {
        if (this.hasStore(c)) {
          const comp = new c();
          entity.set(comp);
        } else {
          const comp = c(this);
          entity.set(comp);
        }
      } else {
        entity.set(c);
      }
    }
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

  destroyEntities(filter?: (entity: Entity) => boolean) {
    filter = filter || (() => true);
    this._level._entities.forEach((e) => {
      if (filter!(e)) {
        this.destroyNow(e);
      }
    });
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

  getUniqueOr<T>(comp: Component<T>, fn: () => T & WorldInit): T {
    const v = this.getUnique(comp);
    if (v !== undefined) {
      return v;
    }
    const newV = fn();
    this.setUnique(newV);
    return newV;
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

  hasStore<T>(comp: Component<T>): boolean {
    return this._level.hasStore(comp);
  }

  ///////////////////////////
}
