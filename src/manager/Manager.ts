import { Component, Entity, Index } from "../core";

export class Manager<T> {
  _comp: Component<T>;
  _data: Map<Index, T>;

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

    let prior = this._data.get(entity.index);
    this._data.set(entity.index, comp);
    return prior;
  }

  fetch(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    return this._data.get(entity.index);
  }

  update(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    entity._updateComp(this._comp);
    return this._data.get(entity.index);
  }

  // This is immediate
  remove(entity: Entity): T | undefined {
    if (!entity.isAlive()) return undefined;
    entity._removeComp(this._comp);

    let prior = this._data.get(entity.index);
    this._data.delete(entity.index);
    return prior;
  }

  has(entity: Entity): boolean {
    if (!entity.isAlive()) return false;
    return this._data.has(entity.index);
  }

  destroyEntity(entity: Entity): void {
    this._data.delete(entity.index);
  }

  destroyEntities(entities: Entity[]): void {
    entities.forEach((e) => this.destroyEntity(e));
  }
}
