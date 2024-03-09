import { System } from "../system/system.js";
import { ComponentManager } from "../component/manager.js";
import { Store } from "../component/store.js";
import { ComponentSource, Entities, Entity } from "../entity/entity.js";
import { AnyComponent, Component } from "../component/component.js";
import { Resources } from "./resources.js";
import { AddStepOpts, SystemManager } from "../system/manager.js";

export interface WorldInit {
  worldInit?(world: World): void;
}

export interface WorldEventHandler {
  destroyEntity(entity: Entity): void;
}

export class World implements ComponentSource {
  _systems: SystemManager;
  _components: ComponentManager;
  _entities: Entities;
  _toDestroy: Entity[];
  delta: number;
  time: number;
  _currentTick: number;
  _globals: Resources;
  notify: WorldEventHandler[];

  constructor() {
    this._entities = new Entities(this);
    this.delta = 0;
    this.time = 0;
    this._currentTick = 1;
    this._components = new ComponentManager();
    this._systems = new SystemManager();
    this._toDestroy = [];
    this._globals = new Resources();
    this.notify = [];
  }

  currentTick(): number {
    return this._currentTick;
  }

  registerComponent<T>(comp: Component<T>, store?: Store<T>): World {
    this._components.register(comp, store);
    return this;
  }

  registerComponents(...comp: AnyComponent[]): World {
    comp.forEach((c) => {
      this._components.register(c);
    });
    return this;
  }

  setGlobal<T>(
    val: T & WorldInit,
    initFn?: (global: T, world: World) => void
  ): World {
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

  addSystemSet(name: string, steps?: string[]): World {
    this._systems.addSet(name, steps);
    return this;
  }

  addSystemStep(set: string, step: string, opts?: AddStepOpts): World;
  addSystemStep(step: string, opts?: AddStepOpts): World;
  addSystemStep(
    ...args: [string, AddStepOpts?] | [string, string, AddStepOpts?]
  ): World {
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
  addSystem(system: System, ...args: any[]): World {
    if (typeof args.at(-1) === "boolean") {
      system.setEnabled(args.at(-1));
      args.pop();
    }
    this._systems.addSystem(system, ...args);
    return this;
  }

  init(fn: (world: World) => void): World {
    fn(this);
    return this;
  }

  start(): World {
    this._systems.start(this);
    return this;
  }

  getStore<T>(comp: Component<T>): Store<T> {
    return this._components.getStore(comp);
  }

  create(...withComps: any[]): Entity {
    const entity = this._entities.create();
    withComps.forEach((c) => {
      entity.set(c);
    });
    return entity;
  }

  // _beforeSystemRun() {
  //   // this.toUpdate.forEach((entity) => {
  //   //   const components = entity.allComponents(); // this.componentManager.getAllComponents(entity);
  //   //   this.systems.forEach((system) => system.accept(entity, components));
  //   // });
  //   // this.toUpdate = [];
  // }

  runSystems(delta: number = 0) {
    this.runSystemSet("default", delta);
  }

  runSystemSet(set: string, delta: number = 0): void {
    this.delta = delta;
    this.time += delta;

    this._systems.runSet(set, this, this.time, this.delta);

    // force a cleanup in case no systems run (mainly for testing)
    // also forces a tick
    this._afterSystemRun();

    if (this._currentTick > 100000) {
      this._currentTick -= 100000;
      this._entities.rebase(100000);
      this._systems.rebase(100000);
    }
  }

  _afterSystemRun(): void {
    this._currentTick += 1; // Tick for each system (must be after)
    if (this._toDestroy.length) {
      this._toDestroy.forEach((entity) => {
        this.notify.forEach((n) => n.destroyEntity(entity));
      });
      // this._systems.forEach((system) =>
      //   system.destroyEntities(this._toDestroy)
      // );
      this._components.destroyEntities(this._toDestroy);
      this._entities.destroyEntities(this._toDestroy);
      this._toDestroy = [];

      this._currentTick += 1; // Tick for destroy
    }
  }

  // queueUpdate(entity: Entity): void {
  //   if (!this.toUpdate.includes(entity)) {
  //     this.toUpdate.push(entity);
  //   }
  // }

  queueDestroy(entity: Entity): void {
    // this._entities.queueDestroy(entity);
    this._toDestroy.push(entity);
  }

  destroyNow(entity: Entity): void {
    this.notify.forEach((n) => n.destroyEntity(entity));
    // this._systems.forEach((system) => system.destroyEntity(entity));
    this._components.destroyEntity(entity);
    this._entities.destroy(entity);
    entity._destroy();
  }

  entities(): Entities {
    return this._entities;
  }

  /// Resources

  globals(): Resources {
    return this._globals;
  }

  // set<T>(val: T) {
  //   this._resources.set(val);
  // }

  getGlobal<T>(comp: Component<T>): T {
    return this._globals.get(comp);
  }

  deleteGlobal<T>(comp: Component<T>) {
    this._globals.delete(comp);
  }

  /// ComponentSource

  fetchComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this._components.getStore(comp);
    if (!mgr) return undefined;
    return mgr.fetch(entity);
  }

  updateComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this._components.getStore(comp);
    if (!mgr) return undefined;
    return mgr.update(entity);
  }

  setComponent<T>(entity: Entity, val: T, comp?: Component<T>): void {
    // @ts-ignore
    comp = comp || val.constructor;
    if (!comp) throw new Error("Missing constructor!");
    const mgr = this._components.getStore(comp);
    if (!mgr) throw new Error("Using unregistered component: " + comp.name);
    mgr.set(entity, val);
  }

  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this._components.getStore(comp);
    return mgr && mgr.remove(entity);
  }
}
