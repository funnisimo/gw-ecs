import { Component, Entity } from "../core";
import { Manager, TimeSource } from "./manager";

interface IManager {
  [name: string]: Manager<any>;
}

export class ComponentManager {
  private managers: IManager;
  _world: TimeSource;

  constructor(world: TimeSource) {
    this.managers = {};
    this._world = world;
  }

  register<T>(comp: Component<T>): void {
    this.managers[comp.name] = new Manager(this._world, comp);
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

  compactAndRebase(zeroTime: number): void {
    Object.values(this.managers).forEach((mgr) =>
      mgr.compactAndRebase(zeroTime)
    );
  }
}
