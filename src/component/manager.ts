import { Entity } from "../entity";
import { AnyComponent, Component } from "./component";
import { AnyComponentStore, ComponentStore } from "./store";

export class ComponentManager {
  private stores: Map<AnyComponent, AnyComponentStore>;

  constructor() {
    this.stores = new Map();
  }

  register<T>(comp: Component<T>): void {
    this.stores.set(comp, new ComponentStore(comp));
  }

  getManager<T>(comp: Component<T>): ComponentStore<T> {
    return this.stores.get(comp) as ComponentStore<T>;
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
