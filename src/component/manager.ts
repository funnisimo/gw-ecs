import { Entity } from "../entity/entity.js";
import { AnyComponent, Component } from "./component.js";
import { AnyStore, SetStore, CompStore } from "./store.js";

export class ComponentManager {
  private stores: Map<AnyComponent, AnyStore>;

  constructor() {
    this.stores = new Map();
  }

  register<T>(comp: Component<T>, store?: CompStore<T>): void {
    if (this.stores.get(comp) && !store) return;
    store = store || new SetStore(comp);
    this.stores.set(comp, store);
  }

  getStore<T>(comp: Component<T>): CompStore<T> {
    return this.stores.get(comp) as CompStore<T>;
  }

  destroyEntity(entity: Entity): void {
    for (let store of this.stores.values()) {
      store.destroyEntity(entity);
    }
  }

  destroyEntities(entities: Entity[]): void {
    for (let store of this.stores.values()) {
      store.destroyEntities(entities);
    }
  }
}
