import { Entity } from "../entity/entity.js";
import { Component } from "./component.js";

export interface Store<T> {
  has(entity: Entity): boolean;

  add(entity: Entity, comp: T): void;
  fetch(entity: Entity): T | undefined;
  update(entity: Entity): T | undefined;
  remove(entity: Entity): T | undefined; // This is immediate

  singleEntity(): Entity | undefined;
  entities(): IterableIterator<Entity>;
  values(): IterableIterator<T>;
  entries(): IterableIterator<[Entity, T]>;

  destroyEntity(entity: Entity): void;
  destroyEntities(entities: Entity[]): void;
}

export type AnyStore = Store<any>;

export class SetStore<T> implements Store<T> {
  _comp: Component<T>;
  _data: Set<Entity>;

  constructor(comp: Component<T>) {
    this._comp = comp;
    this._data = new Set();
  }

  /**
   *
   * @param entity
   * @param comp
   * @returns Prior value - if any
   */
  add(entity: Entity, comp: T): void {
    if (!entity.isAlive()) return undefined;
    entity._addComp(this._comp, comp);
    this._data.add(entity);
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
    return v;
  }

  has(entity: Entity): boolean {
    if (!entity.isAlive()) return false;
    return this._data.has(entity);
  }

  singleEntity(): Entity | undefined {
    return this._data.keys().next().value;
  }

  entities() {
    return this._data.keys();
  }

  singleValue(): T | undefined {
    const entity = this.singleEntity();
    return entity && (entity.fetch(this._comp) as T);
  }

  *values() {
    for (let entity of this._data.keys()) {
      yield entity.fetch(this._comp) as T;
    }
  }

  singleEntry(): [Entity, T] | undefined {
    const entity = this.singleEntity();
    return entity && [entity, entity.fetch(this._comp) as T];
  }

  *entries() {
    for (let entity of this._data.keys()) {
      yield [entity, entity.fetch(this._comp)] as [Entity, T];
    }
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
