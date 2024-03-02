import { System } from "../system/system";
import { ComponentManager } from "../manager/componentManager";
import { Manager } from "../manager/manager";
import { ComponentSource, Entities, Entity } from "./entity";
import { Component } from "./component";

export class World implements ComponentSource {
  _systems: System[];
  _components: ComponentManager;
  _entities: Entities;
  _destroyedEntities: Entity[];
  delta: number;
  time: number;
  _currentTick: number;

  constructor() {
    this._entities = new Entities(this);
    this.delta = 0;
    this.time = 0;
    this._currentTick = 0;
    this._components = new ComponentManager();
    this._systems = [];
    this._destroyedEntities = [];
  }

  currentTick(): number {
    return this._currentTick;
  }

  registerComponent<T>(...comp: Component<T>[]): World {
    comp.forEach((c) => {
      this._components.register(c);
    });
    return this;
  }

  addSystem(system: System, enable: boolean = true): World {
    system.setEnabled(enable);
    this._systems.push(system);
    return this;
  }

  init(): void {
    this._systems.forEach((system) => system.init(this));
  }

  getComponentManager<T>(comp: Component<T>): Manager<T> {
    return this._components.getManager(comp);
  }

  create(): Entity {
    return this._entities.create();
  }

  _beforeSystemProcess() {
    // this.toUpdate.forEach((entity) => {
    //   const components = entity.allComponents(); // this.componentManager.getAllComponents(entity);
    //   this.systems.forEach((system) => system.accept(entity, components));
    // });
    // this.toUpdate = [];
  }

  process(delta: number = 0): void {
    this.delta = delta;
    this.time += delta;
    this._currentTick += 1; // Make sure we always tick at least once

    this._systems.forEach((system) => {
      this._beforeSystemProcess();
      system.process();
      this._afterSystemProcess();
      this._currentTick += 1; // Tick after each system
    });

    this._afterSystemProcess(); // In case no systems run

    if (this._currentTick > 100000) {
      this._currentTick -= 100000;
      this._entities.rebase(100000);
      this._systems.forEach((system) => system.rebase(100000));
    }
  }

  _afterSystemProcess(): void {
    // TODO - Should this be done less often?  Once per process cycle?
    // this._entities.processDestroyed((deleted) => {
    //   this._components.cleanEntities(deleted);
    // });

    if (this._destroyedEntities.length) {
      this._systems.forEach((system) =>
        system.destroyEntities(this._destroyedEntities)
      );
      this._components.destroyEntities(this._destroyedEntities);
      this._destroyedEntities.forEach((e) => e._destroy());
      this._destroyedEntities = [];
    }
  }

  // queueUpdate(entity: Entity): void {
  //   if (!this.toUpdate.includes(entity)) {
  //     this.toUpdate.push(entity);
  //   }
  // }

  queueDestroy(entity: Entity): void {
    // this._entities.queueDestroy(entity);
    this._destroyedEntities.push(entity);
  }

  destroyNow(entity: Entity): void {
    this._components.destroyEntity(entity);
    entity._destroy();
  }

  entities(): Entities {
    return this._entities;
  }

  /// ComponentSource

  fetchComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this._components.getManager(comp);
    if (!mgr) return undefined;
    return mgr.fetch(entity);
  }

  updateComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    const mgr = this._components.getManager(comp);
    if (!mgr) return undefined;
    return mgr.update(entity);
  }

  addComponent<T>(entity: Entity, val: T, comp?: Component<T>): T | undefined {
    // @ts-ignore
    comp = comp || val.constructor;
    if (!comp) throw new Error("Missing constructor!");
    const mgr = this._components.getManager(comp);
    if (!mgr) throw new Error("Using unregistered component: " + comp.name);
    return mgr.add(entity, val);
  }

  removeComponent<T>(entity: Entity, comp: Component<T>): T | undefined {
    return this._components.getManager(comp).remove(entity);
  }
}
