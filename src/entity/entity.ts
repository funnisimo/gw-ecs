import type { Component, AnyComponent } from "../component/component";

export interface ComponentSource {
  currentTick(): number;

  fetchComponent<T>(entity: Entity, comp: Component<T>): T | undefined;
  updateComponent<T>(entity: Entity, comp: Component<T>): T | undefined;
  addComponent<T>(entity: Entity, val: T, comp?: Component<T>): T | undefined; // TODO - Return replaced value?
  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined; // TODO - Return deleted value?
}

export type Index = number;
export type Gen = number;

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

export class Entity {
  index: Index;
  gen: Gen;

  _source: ComponentSource;
  _comps: UsageData[];

  constructor(source: ComponentSource, index: Index, gen: Gen = 1) {
    this.index = index;
    this.gen = gen;
    this._source = source;
    this._comps = [];
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
      this._comps.forEach((c) => this._source.removeComponent(this, c.comp));
      this._comps = [];
    }
  }

  has(comp: AnyComponent): boolean {
    const data = this._comps.find((d) => d.comp === comp);
    return !!data && data.removed < 0;
  }

  fetch<T>(comp: Component<T>): T | undefined {
    return this._source.fetchComponent(this, comp);
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
    this._comps = this._comps.filter((c) => {
      if (c.removed > 0 && c.removed < zeroTick) {
        return false;
      } else {
        c.rebase(zeroTick);
        return true;
      }
    });
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
