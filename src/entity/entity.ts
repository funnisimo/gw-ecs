import type { Component, AnyComponent } from "../component/component.js";

export interface ComponentSource {
  currentTick(): number;

  setComponent<T>(entity: Entity, val: T, comp?: Component<T>): void; // TODO - Return replaced value?
  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined;
}

export type Index = number;
export type Gen = number;

class CompData<T> {
  data: T;
  added: number;
  updated: number;
  removed: number;

  constructor(data: T, added: number) {
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

type AnyCompData = CompData<any>;

export class Entity {
  index: Index;
  gen: Gen;

  _source: ComponentSource | null;
  _comps: Map<AnyComponent, AnyCompData>;

  constructor(index: Index, gen: Gen = 1, source?: ComponentSource) {
    this.index = index;
    this.gen = gen;
    this._source = source || null;
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

  set<T>(val: T, comp?: Component<T>): void {
    // @ts-ignore
    comp = comp || val.constructor;
    this._source
      ? this._source.setComponent(this, val, comp)
      : this._setComp(comp!, val);
  }

  setAll(...val: any[]): void {
    val.forEach((v) => this.set(v));
  }

  _setComp(comp: AnyComponent, val: any): void {
    const data = this._comps.get(comp);
    if (!data) {
      this._comps.set(
        comp,
        new CompData(val, this._source ? this._source.currentTick() : 0)
      );
    } else {
      data.added = data.updated = this._source ? this._source.currentTick() : 0;
      data.removed = -1;
      data.data = val;
    }
  }

  isAddedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.get(comp);
    return !!data && data.added > tick && data.removed < 0;
  }

  remove<T>(comp: Component<T>): T | undefined {
    return this._source
      ? this._source.removeComponent(this, comp)
      : this._removeComp(comp);
  }

  _removeComp<T>(comp: AnyComponent): T | undefined {
    const data = this._comps.get(comp);
    if (data && data.removed < 0) {
      data.removed = this._source ? this._source.currentTick() : 0;
      return data.data;
    }
    return undefined;
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
      data.updated = this._source ? this._source.currentTick() : 0;
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

export interface EntityWatcher {
  entityCreated?(entity: Entity): void;
  entityDestroyed?(entity: Entity): void;
}

export class Entities {
  _all: (Entity | number)[];
  _source: ComponentSource;
  _notify: EntityWatcher[];
  // _toDelete: Entity[];

  constructor(source: ComponentSource) {
    this._source = source;
    this._all = [];
    this._notify = [];
    // this._toDelete = [];
  }

  toJSON(): string {
    return JSON.stringify({ _all: this._all });
  }

  notify(handler: EntityWatcher): void {
    this._notify.push(handler);
  }

  // TODO - stopNotify??

  create(): Entity {
    const index = this._all.findIndex((e) => typeof e === "number");
    if (index >= 0) {
      const oldGen = this._all[index] as number;
      const entity = new Entity(index, oldGen + 1, this._source);
      this._all[index] = entity;
      this._notify.forEach((h) => h.entityCreated && h.entityCreated(entity));
      return entity;
    }
    const newE = new Entity(this._all.length, 1, this._source);
    this._all.push(newE);
    this._notify.forEach((h) => h.entityCreated && h.entityCreated(newE));
    return newE;
  }

  destroy(entity: Entity) {
    const oldGen = entity.gen;
    this._all[entity.index] = oldGen;
    this._notify.forEach((h) => h.entityDestroyed && h.entityDestroyed(entity));
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

  count(): number {
    return this._all.reduce((c: number, e) => {
      return typeof e !== "number" ? c + 1 : c;
    }, 0);
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
