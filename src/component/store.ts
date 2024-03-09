import { Entity } from "../entity/entity.js";
import { Component } from "./component.js";

export interface StoreWatcher<T> {
  compSet?(entity: Entity, comp: T): void;
  compRemoved?(entity: Entity, comp: T): void;
}

export interface CompStore<T> {
  has(entity: Entity): boolean;

  set(entity: Entity, comp: T): void;
  fetch(entity: Entity): T | undefined;
  update(entity: Entity): T | undefined;
  remove(entity: Entity): T | undefined; // This is immediate

  singleEntity(): Entity | undefined;
  forEach(fn: (entity: Entity, comp: T) => void): void;

  notify(watcher: StoreWatcher<T>): void;
  stopNotify(watcher: StoreWatcher<T>): void;

  entities(): Entity[];
  values(): T[];
  entries(): [Entity, T][];

  // TODO - Move these to different interface
  destroyEntity(entity: Entity): void;
  destroyEntities(entities: Entity[]): void;
}

export type AnyStore = CompStore<any>;

export class SetStore<T> implements CompStore<T> {
  _comp: Component<T>;
  _data: Set<Entity>;
  _watchers: (StoreWatcher<T> | null)[];

  constructor(comp: Component<T>) {
    this._comp = comp;
    this._data = new Set();
    this._watchers = [];
  }

  notify(watcher: StoreWatcher<T>) {
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
  set(entity: Entity, comp: T): void {
    if (!entity.isAlive()) return undefined;
    entity._setComp(this._comp, comp);
    this._data.add(entity);
    this._watchers.forEach((w) => w && w.compSet && w.compSet(entity, comp));
  }

  fetch(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    return entity.fetch(this._comp);
  }

  update(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    return entity.update(this._comp);
  }

  // This is immediate
  remove(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    const v = entity.fetch(this._comp);
    entity._removeComp(this._comp);
    this._data.delete(entity);
    if (v) {
      this._watchers.forEach(
        (w) => w && w.compRemoved && w.compRemoved(entity, v)
      );
    }
    return v;
  }

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

  // *added(sinceTick): Iterable<[Entity,T]> {}
  // *updated(sinceTick): Iterable<[Entity,T]> {}

  destroyEntity(entity: Entity): void {
    this._data.delete(entity);
  }

  destroyEntities(entities: Entity[]): void {
    entities.forEach((e) => this.destroyEntity(e));
  }
}

/*
class Person {
    name = 'John';
    age = 23;
}

class Actor extends Person {
    troup = 'Cats';
}

const actor = new Actor();
const person = new Person();

const mgr = new Map();
mgr.set(Person, 'person');

function getEntry(mgr, proto) {
    do {
        // console.log(proto);
        // console.log(mgr.get(proto));
        if (mgr.has(proto)) return mgr.get(proto);
        proto = Object.getPrototypeOf(proto);
    } while (proto && !proto.isPrototypeOf(Object));
}

console.log('person entry = ' + getEntry(mgr, person.constructor));
console.log('actor entry = ' + getEntry(mgr, actor.constructor));

const obj = { a: 1 };
console.log('obj entry = ' + getEntry(mgr, obj.constructor));
*/
