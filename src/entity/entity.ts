import type { Component, AnyComponent } from "../component/component";

export interface ComponentSource {
  currentTick(): number;

  addComponent<T>(entity: Entity, val: T, comp?: Component<T>): void; // TODO - Return replaced value?
  removeComponent<T>(entity: Entity, comp: Component<T>): void; // TODO - Return deleted value?
}

export type Index = number;
export type Gen = number;

class CompData {
  data: any;
  added: number;
  updated: number;
  removed: number;

  constructor(data: any, added: number) {
    this.data = data;
    this.added = this.updated = added;
    this.removed = -1;
  }

  rebase(zeroTick: number) {
    this.added = Math.max(0, this.added - zeroTick);
    this.updated = Math.max(0, this.updated - zeroTick);
    this.removed = Math.max(-1, this.removed - zeroTick);
  }
}

export class Entity {
  index: Index;
  gen: Gen;

  _source: ComponentSource;
  _comps: Map<AnyComponent, CompData>;

  constructor(source: ComponentSource, index: Index, gen: Gen = 1) {
    this.index = index;
    this.gen = gen;
    this._source = source;
    this._comps = new Map();
  }

  toJSON(): string {
    return JSON.stringify({
      index: this.index,
      gen: this.gen,
      _comps: this._comps,
    });
  }

  isAlive(): boolean {
    return this.gen > 0;
  }

  _destroy() {
    if (this.isAlive()) {
      this.gen *= -1;
      this._comps.clear();
    }
  }

  has(comp: AnyComponent): boolean {
    const data = this._comps.get(comp);
    return !!data && data.removed < 0;
  }

  fetch<T>(comp: Component<T>): T | undefined {
    const data = this._comps.get(comp);
    if (!data || data.removed >= 0) return undefined;
    return data.data;
  }

  add<T>(val: T, comp?: Component<T>): void {
    // @ts-ignore
    comp = comp || val.constructor;
    this._source.addComponent(this, val, comp);
  }

  _addComp(comp: AnyComponent, val: any): void {
    const data = this._comps.get(comp);
    if (!data) {
      this._comps.set(comp, new CompData(val, this._source.currentTick()));
    } else {
      data.added = data.updated = this._source.currentTick();
      data.removed = -1;
      data.data = val;
    }
  }

  isAddedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.get(comp);
    return !!data && data.added > tick && data.removed < 0;
  }

  remove<T>(comp: Component<T>): void {
    this._source.removeComponent(this, comp);
  }

  _removeComp(comp: AnyComponent): void {
    const data = this._comps.get(comp);
    if (data) {
      data.removed = this._source.currentTick();
    }
  }

  isRemovedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.get(comp);
    return !!data && data.removed > tick;
  }

  update<T>(comp: Component<T>): T | undefined {
    const data = this._comps.get(comp);
    if (!data || data.removed >= 0) return undefined;
    this._updateComp(comp);
    return data.data;
  }

  _updateComp(comp: AnyComponent): void {
    const data = this._comps.get(comp);
    if (data) {
      data.updated = this._source.currentTick();
    }
  }

  isUpdatedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.get(comp);
    return !!data && data.updated > tick && data.removed < 0;
  }

  // allComponents(): AnyComponent[] {
  //   return this._comps;
  // }

  rebase(zeroTick: number) {
    for (let [comp, data] of this._comps.entries()) {
      if (data.removed > 0 && data.removed < zeroTick) {
        this._comps.delete(comp);
      } else {
        data.rebase(zeroTick);
      }
    }
  }
}

export class Entities {
  _all: (Entity | number)[];
  _source: ComponentSource;
  // _toDelete: Entity[];

  constructor(source: ComponentSource) {
    this._source = source;
    this._all = [];
    // this._toDelete = [];
  }

  toJSON(): string {
    return JSON.stringify({ _all: this._all });
  }

  create(): Entity {
    const index = this._all.findIndex((e) => typeof e === "number");
    if (index >= 0) {
      const oldGen = this._all[index] as number;
      const entity = new Entity(this._source, index, oldGen + 1);
      this._all[index] = entity;
      return entity;
    }
    const newE = new Entity(this._source, this._all.length);
    this._all.push(newE);
    return newE;
  }

  destroy(entity: Entity) {
    const oldGen = entity.gen;
    this._all[entity.index] = oldGen;
    entity._destroy();
  }

  destroyEntities(entities: Entity[]) {
    entities.forEach((e) => this.destroy(e));
  }

  *[Symbol.iterator]() {
    for (let e of this._all) {
      if (e instanceof Entity && e.isAlive()) yield e;
    }
  }

  rebase(zeroTick: number) {
    this._all.forEach((e) => {
      if (e instanceof Entity) {
        e.rebase(zeroTick);
      }
    });
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
