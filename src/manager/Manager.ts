import { Component, Entity, EntityId } from "../core";

export class Manager<T> {
  _comp: Component<T>;
  _data: Map<EntityId, T>;

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
    const id = entity.id;
    if (!id.isAlive()) return undefined;
    entity._addComp(this._comp);

    let prior = this._data.get(id);
    this._data.set(id, comp);
    return prior;
  }

  fetch(entity: Entity): T | undefined {
    const id = entity.id;
    if (!id.isAlive()) return undefined;
    return this._data.get(id);
  }

  update(entity: Entity): T | undefined {
    const id = entity.id;
    if (!id.isAlive()) return undefined;
    entity._updateComp(this._comp);
    return this._data.get(id);
  }

  // This is immediate
  remove(entity: Entity): T | undefined {
    const id = entity.id;
    if (!id.isAlive()) return undefined;
    entity._removeComp(this._comp);

    let prior = this._data.get(id);
    this._data.delete(id);
    return prior;
  }

  has(entity: Entity): boolean {
    const id = entity.id;
    if (!id.isAlive()) return false;
    return this._data.has(id);
  }

  destroyEntity(entity: Entity): void {
    const id = entity.id;
    this._data.delete(id);
  }

  destroyEntities(entities: Entity[]): void {
    entities.forEach((e) => this.destroyEntity(e));
  }
}
