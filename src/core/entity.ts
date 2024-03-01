import type { Component } from "./component";

export interface ComponentSource {
  fetch<T>(comp: Component<T>, entity: Entity): T | undefined;
  addComponent<T>(comp: Component<T>, entity: Entity, val: any): void;
  removeComponent<T>(comp: Component<T>, entity: Entity): void; // TODO - Return deleted value?
}

export class Entity {
  _index: number;
  _gen: number;
  _source: ComponentSource;
  _comps: Component<any>[]; // TODO - keep constructors instead of names?

  constructor(source: ComponentSource, index = 0, gen = 1) {
    this._source = source;
    this._index = index;
    this._gen = gen;
    this._comps = [];
  }

  isAlive(): boolean {
    return this._gen > 0;
  }

  _destroy() {
    if (this.isAlive()) {
      this._gen = -this._gen;
      this._comps.forEach((c) => this._source.removeComponent(c, this));
      this._comps = [];
    }
  }

  revive() {
    if (this.isAlive()) throw new Error("Entity is not dead.");
    this._gen = 1 - this._gen; // gen is < 0 so this is 1 + -gen
    this._comps = [];
  }

  add<T>(comp: Component<T>, val: T): boolean {
    this._source.addComponent(comp, this, val);
    return this._addComp(comp);
  }

  _addComp(comp: Component<any>): boolean {
    if (this._comps.includes(comp)) {
      return false;
    }
    this._comps.push(comp);
    return true;
  }

  remove<T>(comp: Component<T>): boolean {
    this._source.removeComponent(comp, this);
    return this._removeComp(comp);
  }

  _removeComp(comp: Component<any>): boolean {
    const index = this._comps.indexOf(comp);
    if (index < 0) {
      return false;
    }
    this._comps.splice(index, 1);
    return true;
  }

  has(comp: Component<any>): boolean {
    return this._comps.includes(comp);
  }

  fetch<T>(comp: Component<T>): T | undefined {
    return this._source.fetch(comp, this);
  }

  allComponents(): Component<any>[] {
    return this._comps;
  }
}

export class Entities {
  _all: Entity[];
  _source: ComponentSource;
  _toDelete: Entity[];

  constructor(source: ComponentSource) {
    this._source = source;
    this._all = [];
    this._toDelete = [];
  }

  create(): Entity {
    const e = this._all.find((e) => !e.isAlive());
    if (e) {
      e.revive();
      return e;
    }
    const newE = new Entity(this._source, this._all.length);
    this._all.push(newE);
    return newE;
  }

  queueDestroy(e: Entity) {
    if (this._toDelete.includes(e)) return;
    this._toDelete.push(e);
  }

  destroyNow(e: Entity) {
    e._destroy();
  }

  process() {
    this._toDelete.forEach((e) => e._destroy());
    this._toDelete = [];
  }
}
