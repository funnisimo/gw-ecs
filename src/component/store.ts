import { Entity } from "../entity";
import { Component } from "./component";

export class ComponentStore<T> {
  _comp: Component<T>;
  _data: Map<Entity, T>;

  constructor(comp: Component<T>) {
    this._comp = comp;
    this._data = new Map();
  }

  /**
   *
   * @param entity
   * @param comp
   * @returns Prior value - if any
   */
  add(entity: Entity, comp: T): T | undefined {
    if (!entity.isAlive()) return undefined;
    entity._addComp(this._comp);

    let prior = this._data.get(entity);
    this._data.set(entity, comp);
    return prior;
  }

  fetch(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    return this._data.get(entity);
  }

  update(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    entity._updateComp(this._comp);
    return this._data.get(entity);
  }

  // This is immediate
  remove(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    entity._removeComp(this._comp);

    let prior = this._data.get(entity);
    this._data.delete(entity);
    return prior;
  }

  has(entity: Entity): boolean {
    if (!entity.isAlive()) return false;
    return this._data.has(entity);
  }

  keys() {
    return this._data.keys();
  }

  values() {
    return this._data.values();
  }

  entries() {
    return this._data.entries();
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

export type AnyComponentStore = ComponentStore<any>;
