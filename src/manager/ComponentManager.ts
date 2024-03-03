import { AnyComponent, Component, Entity } from "../core";
import { AnyManager, Manager } from "./manager";

export class ComponentManager {
  private managers: Map<AnyComponent, AnyManager>;

  constructor() {
    this.managers = new Map();
  }

  register<T>(comp: Component<T>): void {
    this.managers.set(comp, new Manager(comp));
  }

  getManager<T>(comp: Component<T>): Manager<T> {
    return this.managers.get(comp) as Manager<T>;
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
