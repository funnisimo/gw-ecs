// import { Entity } from "../entity/entity.js";
import { Entity } from "../entity/entity.js";
import { AnyComponent, Component } from "./component.js";
import { AnyStore, SetStore, CompStore } from "./store.js";

export class ComponentManager {
  _stores: Map<AnyComponent, AnyStore>;

  constructor() {
    this._stores = new Map();
  }

  register<T extends Object>(
    comp: Component<T>,
    store?: CompStore<T>
  ): CompStore<T> {
    const existing = this._stores.get(comp); // do not look at base classes
    if (existing && !store) return existing;
    store = store || new SetStore(comp);
    this._stores.set(comp, store);
    return store;
  }

  getStore<T extends Object>(comp: Component<T>): CompStore<T> | undefined {
    do {
      // Look for base class if we don't have this class
      const store = this._stores.get(comp);
      if (store) return store;
      comp = Object.getPrototypeOf(comp);
    } while (comp && !comp.isPrototypeOf(Object));
  }

  hasStore<T extends Object>(comp: Component<T>): boolean {
    do {
      // Look for base class if we don't have this class
      const store = this._stores.get(comp);
      if (store) return true;
      comp = Object.getPrototypeOf(comp);
    } while (comp && !comp.isPrototypeOf(Object));
    return false;
  }

  entityCreated(entity: Entity) {
    for (let store of this._stores.values()) {
      store.entityCreated && store.entityCreated(entity);
    }
  }

  entityDestroyed(entity: Entity) {
    for (let store of this._stores.values()) {
      store.entityDestroyed && store.entityDestroyed(entity);
    }
  }

  // removeAll() {
  //   for (let store of this.stores.values()) {
  //     store.removeAll();
  //   }
  // }
}
