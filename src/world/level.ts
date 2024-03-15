import { AnyComponent, Component } from "../component/component.js";
import { ComponentManager } from "../component/manager.js";
import { CompStore } from "../component/store.js";
import { ComponentSource, Entities, Entity } from "../entity/entity.js";
import {
  Queue,
  QueueManager,
  QueueReader,
  QueueStore,
} from "../utils/queue.js";
import { Resources } from "./resources.js";

export interface LevelInit {
  levelInit?(level: Level): void;
}

export class Level implements ComponentSource {
  _components: ComponentManager;
  _queues: QueueManager; // TODO - stored in globals
  _entities: Entities;
  _toDestroy: Entity[];
  delta: number;
  time: number;
  _currentTick: number;
  _uniques: Resources;
  _id: string;

  constructor(id: string) {
    this._id = id;
    this.delta = 0;
    this.time = 0;
    this._currentTick = 1;
    this._toDestroy = [];

    this._entities = new Entities(this);
    this._components = new ComponentManager();
    this._queues = new QueueManager();
    this._uniques = new Resources();
  }

  get id(): string {
    return this._id;
  }

  currentTick(): number {
    return this._currentTick;
  }

  registerComponent<T>(comp: Component<T>, store?: CompStore<T>): this {
    store = this._components.register(comp, store);
    this._entities.notify(store);
    return this;
  }

  registerComponents(...comp: AnyComponent[]): this {
    comp.forEach((c) => {
      this._components.register(c);
    });
    return this;
  }

  registerQueue<T>(comp: Queue<T>): this {
    this._queues.register(comp);
    return this;
  }

  setUnique<T>(
    val: T & LevelInit,
    initFn?: (global: T, level: Level) => void
  ): this {
    this._uniques.set(val);
    const levelInit = val["levelInit"];
    if (levelInit) {
      levelInit.call(val, this);
    }
    if (initFn) {
      initFn(val, this);
    }
    return this;
  }

  getStore<T>(comp: Component<T>): CompStore<T> {
    const store = this._components.getStore(comp);
    if (!store) throw new Error("Failed to find component store: " + comp.name);
    return store;
  }

  getQueue<T>(queue: Queue<T>): QueueStore<T> {
    const store = this._queues.getStore(queue);
    if (!store) throw new Error("Failed to find queue store: " + queue.name);
    return store;
  }

  getReader<T>(queue: Queue<T>, onlyNew = false): QueueReader<T> {
    const store = this._queues.getStore(queue);
    if (!store) throw new Error("Failed to find queue: " + queue.name);
    return store.reader(onlyNew);
  }

  create(...withComps: any[]): Entity {
    const entity = this._entities.create();
    withComps.forEach((c) => {
      entity.set(c);
    });
    return entity;
  }

  addTime(delta: number) {
    this.delta = delta;
    this.time += delta;
  }

  maintain(): void {
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

    if (this._currentTick > 100000) {
      this.rebase(100000);
    }
  }

  rebase(zeroTick: number) {
    this._currentTick -= zeroTick;
    this._entities.rebase(zeroTick);
    //   this._systems.rebase(zeroTick);
  }

  ////////////

  queueDestroy(entity: Entity): void {
    // this._entities.queueDestroy(entity);
    this._toDestroy.push(entity);
  }

  destroyNow(entity: Entity): void {
    // this._components.destroyEntity(entity);
    this._entities.destroy(entity);
    // entity._destroy();
  }

  entities(): Entities {
    return this._entities;
  }

  /// Resources

  uniques(): Resources {
    return this._uniques;
  }

  getUnique<T>(comp: Component<T>): T {
    return this._uniques.get(comp);
  }

  getUniqueOr<T>(comp: Component<T>, fn: () => T): T {
    return this._uniques.getOr(comp, fn);
  }

  removeUnique<T>(comp: Component<T>) {
    this._uniques.delete(comp);
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

  ///////////////////////////

  push<T>(val: T, comp?: Queue<T>) {
    // @ts-ignore
    comp = comp || val.constructor;
    const queue = this.getQueue(comp!);
    queue.push(val);
  }
}
