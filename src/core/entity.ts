import type { Component, AnyComponent } from "./component";

export interface ComponentSource {
  fetchComponent<T>(entity: Entity, comp: Component<T>): T | undefined;
  updateComponent<T>(entity: Entity, comp: Component<T>): T | undefined;
  addComponent<T>(entity: Entity, val: T, comp?: Component<T>): T | undefined; // TODO - Return replaced value?
  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined; // TODO - Return deleted value?
}

export type Index = number;
export type Gen = number;

export class EntityId {
  _index: Index;
  _gen: Gen;

  constructor(index = 0, gen = 1) {
    this._index = index;
    this._gen = gen;
  }

  isAlive(): boolean {
    return this._gen > 0;
  }

  equals(other: EntityId): boolean {
    return this._index == other._index && this._gen == other._gen;
  }
}

export class Entity extends EntityId {
  _source: ComponentSource;
  _comps: AnyComponent[];

  constructor(source: ComponentSource, index = 0, gen = 1) {
    super(index, gen);
    this._source = source;
    this._comps = [];
  }

  id(): EntityId {
    return new EntityId(this._index, this._gen);
  }

  _destroy() {
    if (this.isAlive()) {
      this._gen = -this._gen;
      this._comps.forEach((c) => this._source.removeComponent(this, c));
      this._comps = [];
    }
  }

  revive() {
    if (this.isAlive()) throw new Error("Entity is not dead.");
    this._gen = 1 - this._gen; // gen is < 0 so this is 1 + -gen
    this._comps = [];
  }

  add<T>(val: T, comp?: Component<T>): T | undefined {
    // @ts-ignore
    comp = comp || val.constructor;
    return this._source.addComponent(this, val, comp);
  }

  _addComp(comp: AnyComponent): void {
    if (!this._comps.includes(comp)) {
      this._comps.push(comp);
    }
  }

  remove<T>(comp: Component<T>): T | undefined {
    return this._source.removeComponent(this, comp);
  }

  _removeComp(comp: AnyComponent): void {
    const index = this._comps.indexOf(comp);
    if (index >= 0) {
      this._comps.splice(index, 1);
    }
  }

  has(comp: AnyComponent): boolean {
    return this._comps.includes(comp);
  }

  fetch<T>(comp: Component<T>): T | undefined {
    return this._source.fetchComponent(this, comp);
  }

  update<T>(comp: Component<T>): T | undefined {
    return this._source.updateComponent(this, comp);
  }

  allComponents(): AnyComponent[] {
    return this._comps;
  }
}

export class Entities {
  _all: Entity[];
  _source: ComponentSource;
  // _toDelete: Entity[];

  constructor(source: ComponentSource) {
    this._source = source;
    this._all = [];
    // this._toDelete = [];
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

  *alive() {
    for (let e of this._all) {
      if (e.isAlive()) yield e;
    }
  }

  // queueDestroy(e: Entity) {
  //   if (this._toDelete.includes(e)) return;
  //   this._toDelete.push(e);
  // }

  // destroyNow(e: Entity) {
  //   e._destroy();
  // }

  // processDestroyed(fn?: (deleted: Entity[]) => void) {
  //   fn = fn || (() => {});
  //   fn(this._toDelete);
  //   this._toDelete.forEach((e) => {
  //     e._destroy();
  //   });
  //   this._toDelete = [];
  // }
}
