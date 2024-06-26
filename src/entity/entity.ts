import type { Component, AnyComponent } from "../component/component.js";

export interface ComponentSource {
  // TODO - updateComponent instead of getTick
  getTick(): number;
  setComponent<T extends Object>(
    entity: Entity,
    val: T,
    comp?: Component<T>
  ): void; // TODO - Return replaced value?
  removeComponent<T extends Object>(
    entity: Entity,
    comp: Component<T>
  ): T | undefined;
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

  // _source: ComponentSource | null;
  _comps: Map<AnyComponent, AnyCompData>;

  // constructor(index: Index, gen: Gen = 1, source?: ComponentSource) {
  constructor(index: Index, gen: Gen = 1) {
    this.index = index;
    this.gen = gen;
    // this._source = source || null;
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

  fetch<T extends Object>(comp: Component<T>): T | undefined {
    const data = this._comps.get(comp);
    if (!data || data.removed >= 0) return undefined;
    return data.data;
  }

  fetchOr<T extends Object>(comp: Component<T>, fn: () => T): T {
    let t = this.fetch(comp);
    if (t === undefined) {
      t = fn();
      this.set(t, comp);
    }
    return t;
  }

  set<T extends Object>(val: T, comp?: Component<T>): void {
    comp = comp || ((<Object>val).constructor as Component<T>);
    this._setComp(comp!, val, 0);
  }

  setAll(...val: any[]): void {
    val.forEach((v) => {
      this.set(v);
    });
  }

  _setComp(comp: AnyComponent, val: any, tick: number): void {
    const data = this._comps.get(comp);
    if (!data) {
      this._comps.set(comp, new CompData(val, tick));
    } else {
      data.added = data.updated = tick;
      data.removed = -1;
      data.data = val;
    }
  }

  isAddedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.get(comp);
    return !!data && data.added > tick && data.removed < 0;
  }

  remove<T extends Object>(comp: Component<T>): T | undefined {
    return this._removeComp(comp, 0);
  }

  _removeComp<T>(comp: AnyComponent, tick: number): T | undefined {
    const data = this._comps.get(comp);
    if (data && data.removed < 0) {
      data.removed = tick;
      return data.data;
    }
    return undefined;
  }

  isRemovedSince(comp: AnyComponent, tick: number): boolean {
    const data = this._comps.get(comp);
    return !!data && data.removed > tick;
  }

  fetchRemoved<T extends Object>(
    comp: Component<T>,
    sinceTick: number = 0
  ): T | undefined {
    const data = this._comps.get(comp);
    if (data && data.removed > sinceTick) {
      return data.data;
    }
    return undefined;
  }

  update<T extends Object>(comp: Component<T>): T | undefined {
    return this._updateComp(comp, 0);
  }

  updateOr<T extends Object>(comp: Component<T>, fn: () => T): T {
    let t = this.update(comp);
    if (t === undefined) {
      t = fn();
      this.set(t, comp);
    }
    return t;
  }

  _updateComp<T extends Object>(
    comp: Component<T>,
    tick: number
  ): T | undefined {
    const data = this._comps.get(comp);
    if (!data || data.removed >= 0) return undefined;
    data.updated = tick;
    return data.data;
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

export class WorldEntity extends Entity {
  _source: ComponentSource;

  constructor(index: Index, gen: Gen = 1, source: ComponentSource) {
    super(index, gen);
    this._source = source;
  }

  set<T extends Object>(val: T, comp?: Component<T>): void {
    comp = comp || ((<Object>val).constructor as Component<T>);
    this._source.setComponent(this, val, comp);
  }

  remove<T extends Object>(comp: Component<T>): T | undefined {
    return this._source.removeComponent(this, comp);
  }

  update<T extends Object>(comp: Component<T>): T | undefined {
    return this._updateComp(comp, this._source.getTick());
  }
}

export interface EntityWatcher {
  entityCreated?(entity: Entity): void;
  entityDestroyed?(entity: Entity): void;
}

export class WorldEntities {
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
      const entity = new WorldEntity(index, oldGen + 1, this._source);
      this._all[index] = entity;
      this._notify.forEach((h) => h.entityCreated && h.entityCreated(entity));
      return entity;
    }
    const newE = new WorldEntity(this._all.length, 1, this._source);
    this._all.push(newE);
    this._notify.forEach((h) => h.entityCreated && h.entityCreated(newE));
    return newE;
  }

  destroy(entity: Entity) {
    if (!entity.isAlive()) return;

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
