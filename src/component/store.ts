import { Entity, EntityWatcher } from "../entity/entity.js";
import { Component } from "./component.js";

export interface StoreWatcher<T> {
  compSet?(entity: Entity, comp: T): void;
  compRemoved?(entity: Entity, comp: T): void;
}

export interface CompStore<T> extends EntityWatcher {
  has(entity: Entity): boolean;

  set(entity: Entity, comp: T, tick?: number): void;
  fetch(entity: Entity): T | undefined;
  update(entity: Entity, tick?: number): T | undefined;
  remove(entity: Entity, tick?: number): T | undefined; // This is immediate

  singleEntity(): Entity | undefined;
  forEach(fn: (entity: Entity, comp: T) => void): void;

  notify(watcher: StoreWatcher<T>): void;
  stopNotify(watcher: StoreWatcher<T>): void;
  // setTickSource(source: () => number): void;

  entities(): Entity[];
  values(): T[];
  entries(): [Entity, T][];
  // removeAll(): void;
}

export type AnyStore = CompStore<any>;

export interface CompStoreCtr<T extends Object> extends Function {
  new (comp: Component<T>): CompStore<T>;
}

export type AnyCompStoreCtr = CompStoreCtr<any>;

export class SetStore<T extends Object> implements CompStore<T> {
  _comp: Component<T>;
  _data: Set<Entity>;
  _watchers: (StoreWatcher<T> | null)[];
  // _tickSource: () => number;

  constructor(comp: Component<T>) {
    this._comp = comp;
    this._data = new Set();
    this._watchers = [];
    // this._tickSource = () => 0;
  }

  // setTickSource(source: () => number): void {
  //   this._tickSource = source;
  // }

  notify(watcher: StoreWatcher<T>) {
    // TODO - make sure we don't have duplicates
    let index = this._watchers.indexOf(null);
    if (index >= 0) {
      this._watchers[index] = watcher;
    } else {
      this._watchers.push(watcher);
    }
  }

  stopNotify(watcher: StoreWatcher<T>) {
    const index = this._watchers.indexOf(watcher);
    if (index >= 0) {
      this._watchers[index] = null;
    }
  }

  /**
   *
   * @param entity
   * @param comp
   * @returns Prior value - if any
   */
  set(entity: Entity, comp: T, tick: number = 0): void {
    if (!entity.isAlive()) return undefined;
    entity._setComp(this._comp, comp, tick);
    this._data.add(entity);
    this._watchers.forEach((w) => w && w.compSet && w.compSet(entity, comp));
  }

  fetch(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    return entity.fetch(this._comp);
  }

  update(entity: Entity, tick: number = 0): T | undefined {
    if (!entity.isAlive()) return undefined;
    return entity._updateComp(this._comp, tick);
  }

  // This is immediate
  remove(entity: Entity, tick: number = 0): T | undefined {
    if (!entity.isAlive()) return undefined;
    const v = entity.fetch(this._comp);
    entity._removeComp(this._comp, tick);
    this._data.delete(entity);
    if (v) {
      this._watchers.forEach(
        (w) => w && w.compRemoved && w.compRemoved(entity, v)
      );
    }
    return v;
  }

  // removeAll() {
  //   this._data.forEach((e) => {
  //     this.remove(e);
  //   });
  // }

  has(entity: Entity): boolean {
    if (!entity.isAlive()) return false;
    return this._data.has(entity);
  }

  singleEntity(): Entity | undefined {
    return this._data.keys().next().value;
  }

  forEach(fn: (e: Entity, c: T) => void) {
    for (let entity of this._data.keys()) {
      fn(entity, entity.fetch(this._comp)!);
    }
  }

  entities(): Entity[] {
    return [...this._data.keys()];
  }

  singleValue(): T | undefined {
    const entity = this.singleEntity();
    return entity && (entity.fetch(this._comp) as T);
  }

  values(): T[] {
    let out: T[] = [];
    for (let entity of this._data.keys()) {
      out.push(entity.fetch(this._comp)!);
    }
    return out;
  }

  singleEntry(): [Entity, T] | undefined {
    const entity = this.singleEntity();
    return entity && [entity, entity.fetch(this._comp) as T];
  }

  entries(): [Entity, T][] {
    return this.entities().map((e) => [e, e.fetch(this._comp)!]);
  }

  entityCreated(entity: Entity): void {
    const v = entity.fetch(this._comp);
    if (v) {
      this._data.add(entity);
      this._watchers.forEach((w) => w && w.compSet && w.compSet(entity, v));
    }
  }

  entityDestroyed(entity: Entity): void {
    if (this._data.delete(entity)) {
      const v = entity.fetch(this._comp)!;
      this._watchers.forEach(
        (w) => w && w.compRemoved && w.compRemoved(entity, v)
      );
    }
  }
}
