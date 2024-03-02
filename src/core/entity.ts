import type { Component, AnyComponent } from "./component";

export interface ComponentSource {
  currentTick(): number;

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

class UsageData {
  comp: AnyComponent;
  added: number;
  updated: number;
  removed: number;

  constructor(comp: AnyComponent, added: number) {
    this.comp = comp;
    this.added = this.updated = added;
    this.removed = -1;
  }

  rebase(zeroTick: number) {
    this.added = Math.max(0, this.added - zeroTick);
    this.updated = Math.max(0, this.updated - zeroTick);
    this.removed = Math.max(-1, this.removed - zeroTick);
  }
}

export class Entity extends EntityId {
  _source: ComponentSource;
  _comps: UsageData[];

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
      this._comps.forEach((c) => this._source.removeComponent(this, c.comp));
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
    const data = this._comps.find((d) => d.comp === comp);
    if (!data) {
      this._comps.push(new UsageData(comp, this._source.currentTick()));
    } else {
      data.added = data.updated = this._source.currentTick();
      data.removed = -1;
    }
  }

  isAddedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.find((d) => d.comp === comp);
    return !!data && data.added > tick && data.removed < 0;
  }

  remove<T>(comp: Component<T>): T | undefined {
    return this._source.removeComponent(this, comp);
  }

  _removeComp(comp: AnyComponent): void {
    const data = this._comps.find((d) => d.comp === comp);
    if (data) {
      data.removed = this._source.currentTick();
    }
  }

  isRemovedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.find((d) => d.comp === comp);
    return !!data && data.removed > tick;
  }

  has(comp: AnyComponent): boolean {
    const data = this._comps.find((d) => d.comp === comp);
    return !!data && data.removed < 0;
  }

  fetch<T>(comp: Component<T>): T | undefined {
    return this._source.fetchComponent(this, comp);
  }

  update<T>(comp: Component<T>): T | undefined {
    return this._source.updateComponent(this, comp);
  }

  _updateComp(comp: AnyComponent): void {
    const data = this._comps.find((d) => d.comp === comp);
    if (data) {
      data.updated = this._source.currentTick();
    }
  }

  isUpdatedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.find((d) => d.comp === comp);
    return !!data && data.updated > tick && data.removed < 0;
  }

  // allComponents(): AnyComponent[] {
  //   return this._comps;
  // }

  rebase(zeroTick: number) {
    this._comps.forEach((c) => c.rebase(zeroTick));
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

  rebase(zeroTick: number) {
    this._all.forEach((e) => e.rebase(zeroTick));
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
