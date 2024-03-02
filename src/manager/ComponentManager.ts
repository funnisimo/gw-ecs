import { Component, Entity } from "../core";
import { Manager } from "./manager";

interface IManager {
  [name: string]: Manager<any>;
}

export class ComponentManager {
  private managers: IManager;

  constructor() {
    this.managers = {};
  }

  register<T>(comp: Component<T>): void {
    this.managers[comp.name] = new Manager(comp);
  }

  getManager<T>(comp: Component<T>): Manager<T> {
    return this.managers[comp.name] as Manager<T>;
  }

  // getAllComponents(entity: Entity): AnyComponent[] {
  //   // const components: string[] = [];
  //   // Object.keys(this.managers).forEach((name) => {
  //   //   if (this.managers[name].has(entity)) {
  //   //     components.push(name);
  //   //   }
  //   // });
  //   // return components;
  //   return entity.allComponents();
  // }

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
