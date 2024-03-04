import { Entity } from "../entity";
import { Component } from "./component";

export interface Store<T> {
  has(entity: Entity): boolean;

  add(entity: Entity, comp: T): void;
  fetch(entity: Entity): T | undefined;
  update(entity: Entity): T | undefined;
  remove(entity: Entity): void; // This is immediate

  entities(): Iterator<Entity>;
  values(): Iterator<T>;
  entries(): Iterator<[Entity, T]>;

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
  remove(entity: Entity): void {
    if (!entity.isAlive()) return undefined;
    entity._removeComp(this._comp);

    this._data.delete(entity);
  }

  has(entity: Entity): boolean {
    if (!entity.isAlive()) return false;
    return this._data.has(entity);
  }

  entities() {
    return this._data.keys();
  }

  *values() {
    for (let entity of this._data.keys()) {
      yield entity.fetch(this._comp) as T;
    }
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
