import { World } from "../core";

export class Manager {
  public defaultValue: any;
  private world: World;

  public container: {
    [id: number]: any;
  };

  constructor(world: World, defaultValue: any) {
    this.world = world;
    this.defaultValue = defaultValue;
    this.container = {};
  }

  public add(entity: number, component?: any): void {
    if (component === undefined) {
      this.container[entity] = { ...this.defaultValue };
    } else {
      this.container[entity] = component;
    }
    this.world.update(entity);
  }

  public fetch(entity: number): any {
    if (this.container[entity] === undefined) {
      this.container[entity] = { ...this.defaultValue };
      this.world.update(entity);
    }
    return this.container[entity];
  }

  public remove(entity: number): void {
    delete this.container[entity];
    this.world.update(entity);
  }

  public has(entity: number): boolean {
    return this.container[entity] !== undefined;
  }

  public clean(entity: number): void {
    delete this.container[entity];
  }
}
