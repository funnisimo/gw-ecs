import { Entity } from "../entity";
import { AnyComponent, Component } from "./component";
import { AnyStore, SetStore, Store } from "./store";

export class ComponentManager {
  private stores: Map<AnyComponent, AnyStore>;

  constructor() {
    this.stores = new Map();
  }

  register<T>(comp: Component<T>, store?: Store<T>): void {
    store = store || new SetStore(comp);
    this.stores.set(comp, store);
  }

  getManager<T>(comp: Component<T>): SetStore<T> {
    return this.stores.get(comp) as SetStore<T>;
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
