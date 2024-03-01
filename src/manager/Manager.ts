import { Component, Entity, Gen, Index } from "../core";

export interface TimeSource {
  currentTick(): number;
}

class Data<T> {
  gen: Gen;
  data: T;
  added: number;
  updated: number;
  removed: number;

  constructor(gen: Gen, data: T, time: number) {
    this.gen = gen;
    this.added = this.updated = time;
    this.removed = -1;
    this.data = data;
  }
}

export class Manager<T> {
  _time: TimeSource;
  _comp: Component<T>;
  _data: {
    [entity: Index]: Data<T>;
  };

  constructor(world: TimeSource, comp: Component<T>) {
    this._time = world;
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
      this._data[entity._index] = new Data(
        entity._gen,
        comp,
        this._time.currentTick()
      );
      return undefined;
    }

    const prior = current.data;
    current.data = comp;
    current.added = current.updated = this._time.currentTick();
    current.removed = -1;
    return prior;
  }

  fetch(entity: Entity): T | undefined {
    const v = this._data[entity._index];
    if (!v || v.gen !== entity._gen || v.removed > 0) return undefined; // TODO - log?  Delete?  throw?
    return v.data;
  }

  update(entity: Entity): T | undefined {
    const v = this._data[entity._index];
    if (!v || v.gen !== entity._gen || v.removed > 0) return undefined; // TODO - log?  Delete?  throw?
    v.updated = this._time.currentTick(); // update update time.
    return v.data;
  }

  // This is immediate
  remove(entity: Entity): T | undefined {
    entity._removeComp(this._comp);
    const removed = this._data[entity._index];
    if (removed && removed.gen == entity._gen && removed.removed < 0) {
      removed.removed = this._time.currentTick();
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

  compactAndRebase(zeroTime: number) {
    // Typescript/Javascript oddity...
    Object.entries(this._data).forEach(([is, d]: [string, Data<T>]) => {
      if (d.removed > 0 && d.removed < zeroTime) {
        delete this._data[parseInt(is)];
      } else {
        d.added = Math.max(0, d.added - zeroTime);
        d.updated = Math.max(0, d.updated - zeroTime);
        d.removed = Math.max(-1, d.removed - zeroTime);
      }
    });
  }
}
