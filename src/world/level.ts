import { AnyComponent, Component } from "../component/component.js";
import { ComponentManager } from "../component/manager.js";
import { CompStore, AnyCompStoreCtr, SetStore } from "../component/store.js";
import { Entity } from "../entity/entity.js";
import { Queue, QueueManager, QueueReader, QueueStore } from "./queue.js";
import { Resources } from "./resources.js";

export class Level {
  _id: string;
  _components: ComponentManager;
  _queues: QueueManager; // TODO - stored in globals
  _entities: Set<Entity>;
  _uniques: Resources;

  constructor(id: string) {
    this._id = id;

    this._entities = new Set();
    this._components = new ComponentManager();
    this._queues = new QueueManager();
    this._uniques = new Resources();
  }

  get id(): string {
    return this._id;
  }

  // create(...withComps: any[]): Entity {
  //   const entity = this._entities.create();
  //   withComps.forEach((c) => {
  //     entity.set(c);
  //   });
  //   return entity;
  // }

  // addTime(delta: number) {
  //   this.delta = delta;
  //   this.time += delta;
  // }

  maintain() {
    this._queues.maintain();
  }

  // maintain(): number {
  //   let tick = this._currentTick;
  //   this._currentTick += 1; // Tick for each system (must be after)
  //   if (this._toDestroy.length) {
  //     //   this._toDestroy.forEach((entity) => {
  //     //     this.notify.forEach((n) => n.destroyEntity(entity));
  //     //   });
  //     // this._systems.forEach((system) =>
  //     //   system.destroyEntities(this._toDestroy)
  //     // );
  //     //   this._components.destroyEntities(this._toDestroy);
  //     this._entities.destroyEntities(this._toDestroy);
  //     this._toDestroy = [];

  //     this._currentTick += 1; // Tick for destroy
  //   }

  //   if (tick >= 100000) {
  //     this.rebase(100000);
  //     tick -= 100000;
  //   }
  //   return tick;
  // }

  // rebase(zeroTick: number) {
  //   this._currentTick -= zeroTick;
  //   this._entities.rebase(zeroTick);
  //   //   this._systems.rebase(zeroTick);
  // }

  ////////////

  addEntity(entity: Entity): void {
    this._entities.add(entity);
    this._components.entityCreated(entity);
  }

  removeEntity(entity: Entity): void {
    this._entities.delete(entity);
    this._components.entityDestroyed(entity);
  }

  entities(): Set<Entity> {
    return this._entities;
  }

  /// Resources

  setUnique<T>(val: T): this {
    this._uniques.set(val);
    return this;
  }

  uniques(): Resources {
    return this._uniques;
  }

  getUnique<T>(comp: Component<T>): T {
    return this._uniques.get(comp);
  }

  // getUniqueOr<T>(comp: Component<T>, fn: () => T): T {
  //   return this._uniques.getOr(comp, fn);
  // }

  removeUnique<T>(comp: Component<T>) {
    this._uniques.delete(comp);
  }

  //////////////////////////////////////////////
  /// COMPONENT

  registerComponent<T>(comp: Component<T>, storeCls?: AnyCompStoreCtr): this {
    storeCls = storeCls || SetStore;
    this._components.register(comp, new storeCls(comp));
    return this;
  }

  registerComponents(...comp: AnyComponent[]): this {
    comp.forEach((c) => {
      this._components.register(c);
    });
    return this;
  }

  getStore<T>(comp: Component<T>): CompStore<T> {
    const store = this._components.getStore(comp);
    if (!store) throw new Error("Failed to find component store: " + comp.name);
    return store;
  }

  // fetchComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
  //   const mgr = this._components.getStore(comp);
  //   if (!mgr) return undefined;
  //   return mgr.fetch(entity);
  // }

  // updateComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
  //   const mgr = this._components.getStore(comp);
  //   if (!mgr) return undefined;
  //   return mgr.update(entity);
  // }

  // setComponent<T>(entity: Entity, val: T, comp?: Component<T>): void {
  //   // @ts-ignore
  //   comp = comp || val.constructor;
  //   if (!comp) throw new Error("Missing constructor!");
  //   const mgr = this._components.getStore(comp);
  //   if (!mgr) throw new Error("Using unregistered component: " + comp.name);
  //   mgr.set(entity, val);
  // }

  // removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
  //   const mgr = this._components.getStore(comp);
  //   return mgr && mgr.remove(entity);
  // }

  ///////////////////////////

  registerQueue<T>(comp: Queue<T>): this {
    this._queues.register(comp);
    return this;
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

  pushQueue<T>(val: T, comp?: Queue<T>) {
    // @ts-ignore
    comp = comp || val.constructor;
    const queue = this.getQueue(comp!);
    queue.push(val);
  }
}
