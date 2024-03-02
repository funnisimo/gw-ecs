import { Component, Entity, Gen, Index } from "../core";

class Data<T> {
  gen: Gen;
  data: T;

  constructor(gen: Gen, data: T) {
    this.gen = gen;
    this.data = data;
  }
}

export class Manager<T> {
  _comp: Component<T>;
  _data: {
    [entity: Index]: Data<T>;
  };

  constructor(comp: Component<T>) {
    this._comp = comp;
    this._data = {};
  }

  /**
   *
   * @param entity
   * @param comp
   * @returns Prior value - if any
   */
  add(entity: Entity, comp: T): T | undefined {
    entity._addComp(this._comp);

    let current = this._data[entity._index];
    if (!current) {
      this._data[entity._index] = new Data(entity._gen, comp);
      return undefined;
    }

    const prior = current.data;
    current.data = comp;
    return prior;
  }

  fetch(entity: Entity): T | undefined {
    const v = this._data[entity._index];
    if (!v || v.gen !== entity._gen) return undefined; // TODO - log?  Delete?  throw?
    return v.data;
  }

  update(entity: Entity): T | undefined {
    const v = this._data[entity._index];
    if (!v || v.gen !== entity._gen) return undefined; // TODO - log?  Delete?  throw?
    entity._updateComp(this._comp);
    return v.data;
  }

  // This is immediate
  remove(entity: Entity): T | undefined {
    entity._removeComp(this._comp);
    const removed = this._data[entity._index];
    if (removed && removed.gen == entity._gen) {
      delete this._data[entity._index];
      return removed.data;
    }
    return undefined;
  }

  has(entity: Entity): boolean {
    const v = this._data[entity._index];
    return v && v.gen == entity._gen;
  }

  destroyEntity(entity: Entity): void {
    this.remove(entity);
  }

  destroyEntities(entities: Entity[]): void {
    entities.forEach((e) => this.destroyEntity(e));
  }
}
