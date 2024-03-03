import { Entity } from "../entity";
import { AnyComponent, Component } from "./component";
import { AnyComponentStore, ComponentStore } from "./store";

export class ComponentManager {
  private managers: Map<AnyComponent, AnyComponentStore>;

  constructor() {
    this.managers = new Map();
  }

  register<T>(comp: Component<T>): void {
    this.managers.set(comp, new ComponentStore(comp));
  }

  getManager<T>(comp: Component<T>): ComponentStore<T> {
    return this.managers.get(comp) as ComponentStore<T>;
  }

  destroyEntity(entity: Entity): void {
    Object.values(this.managers).forEach((manager) => {
      manager.destroyEntity(entity);
    });
  }

  destroyEntities(entities: Entity[]): void {
    Object.values(this.managers).forEach((manager) => {
      manager.destroyEntities(entities);
    });
  }
}
