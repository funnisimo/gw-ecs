import { Entity } from "../entity";
import { Component } from "./component";

export class ComponentStore<T> {
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
      yield entity.fetch(this._comp);
    }
  }

  *entries() {
    for (let entity of this._data.keys()) {
      yield [entity, entity.fetch(this._comp)];
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

export type AnyComponentStore = ComponentStore<any>;
