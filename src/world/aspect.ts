import type { AnyComponent } from "../component/component.js";
import { Entity } from "../entity/entity.js";
import { World } from "./world.js";

export class Aspect {
  protected _allComponents: AnyComponent[];
  protected _oneComponents: AnyComponent[][];
  protected _someComponents: AnyComponent[][];
  protected _noneComponents: AnyComponent[];
  protected _addedComponents: AnyComponent[];
  protected _updatedComponents: AnyComponent[];
  protected _removedComponents: AnyComponent[];

  constructor(...allComponents: AnyComponent[]) {
    this._allComponents = allComponents;
    this._oneComponents = [];
    this._noneComponents = [];
    this._someComponents = [];
    this._addedComponents = [];
    this._updatedComponents = [];
    this._removedComponents = [];
  }

  with(...components: AnyComponent[]): Aspect {
    this._allComponents = this._allComponents.concat(components);
    return this;
  }

  one(...components: AnyComponent[]): Aspect {
    if (components.length == 0) return this;
    this._oneComponents.push(components);
    return this;
  }

  some(...components: AnyComponent[]): Aspect {
    if (components.length == 0) return this;
    this._someComponents.push(components);
    return this;
  }

  without(...components: AnyComponent[]): Aspect {
    this._noneComponents = this._noneComponents.concat(components);
    return this;
  }

  added(...components: AnyComponent[]): Aspect {
    this._addedComponents = this._addedComponents.concat(components);
    return this;
  }

  updated(...components: AnyComponent[]): Aspect {
    this._updatedComponents = this._updatedComponents.concat(components);
    return this;
  }

  removed(...components: AnyComponent[]): Aspect {
    this._removedComponents = this._removedComponents.concat(components);
    return this;
  }

  /////////

  match(entity: Entity, sinceTick: number = 0): boolean {
    return (
      this._checkAll(entity) &&
      this._checkNone(entity) &&
      this._checkOne(entity) &&
      this._checkSome(entity) &&
      this._checkAdded(entity, sinceTick) &&
      this._checkUpdated(entity, sinceTick) &&
      this._checkRemoved(entity, sinceTick)
    );
  }

  first(entities: Entity[], sinceTick = 0): Entity | undefined {
    return entities.find((e) => this.match(e, sinceTick));
  }

  every(entities: Entity[], sinceTick = 0): Entity[] {
    return entities.filter((e) => this.match(e, sinceTick));
  }

  /**
   * Returns an iterable across all entities on the active level of the world.
   * This performs the same on a `World` and a `MultiWorld`.
   * @param world
   * @param sinceTick
   */
  *active(world: World, sinceTick: number = 0): Iterable<Entity> {
    for (let entity of world.level.entities()) {
      if (this.match(entity, sinceTick)) {
        yield entity;
      }
    }
  }

  /**
   * Returns an iterable across all entities on the active level of the world.
   * This performs the same on a `World` and a `MultiWorld`.
   * @param world
   * @param sinceTick
   */
  *activeEntries(
    world: World,
    sinceTick: number = 0
  ): Iterable<[Entity, AnyComponent[]]> {
    for (let entity of this.active(world, sinceTick)) {
      yield [entity, this._allComponents.map((c) => entity.fetch(c))];
    }
  }

  /**
   * Returns an iterable across all entities on all levels of the world.
   * On a `World` this is the same as `active` since there is only one level.
   * On a `MultiWorld` this will be across all the added levels.
   * @param world
   * @param sinceTick
   */
  *all(world: World, sinceTick: number = 0): Iterable<Entity> {
    for (let entity of world.entities()) {
      if (this.match(entity, sinceTick)) {
        yield entity;
      }
    }
  }

  /**
   * Returns an iterable across all entities on all levels of the world.
   * On a `World` this is the same as `active` since there is only one level.
   * On a `MultiWorld` this will be across all the added levels.
   * @param world
   * @param sinceTick
   */
  *allEntries(
    world: World,
    sinceTick: number = 0
  ): Iterable<[Entity, AnyComponent[]]> {
    for (let entity of this.all(world, sinceTick)) {
      yield [entity, this._allComponents.map((c) => entity.fetch(c))];
    }
  }

  /////////

  protected _checkAll(entity: Entity) {
    return (
      this._allComponents.length === 0 ||
      this._allComponents.every((comp: AnyComponent) => entity.has(comp))
    );
  }

  protected _checkOne(entity: Entity) {
    return (
      this._oneComponents.length === 0 ||
      this._oneComponents.every((set: AnyComponent[]) => {
        return (
          set.length == 0 ||
          set.reduce(
            (count: number, comp: AnyComponent) =>
              entity.has(comp) ? count + 1 : count,
            0
          ) == 1
        );
      })
    );
  }

  protected _checkSome(entity: Entity): boolean {
    return (
      this._someComponents.length === 0 ||
      this._someComponents.some((set: AnyComponent[]): boolean => {
        return (
          set.length == 0 || set.some((comp: AnyComponent) => entity.has(comp))
        );
      })
    );
  }

  protected _checkNone(entity: Entity) {
    return (
      this._noneComponents.length === 0 ||
      this._noneComponents.every((comp: AnyComponent) => !entity.has(comp))
    );
  }

  protected _checkAdded(entity: Entity, sinceTick: number) {
    return (
      this._addedComponents.length === 0 ||
      this._addedComponents.every((comp: AnyComponent) =>
        entity.isAddedSince(comp, sinceTick)
      )
    );
  }

  protected _checkUpdated(entity: Entity, sinceTick: number) {
    return (
      this._updatedComponents.length === 0 ||
      this._updatedComponents.every((comp: AnyComponent) =>
        entity.isUpdatedSince(comp, sinceTick)
      )
    );
  }

  protected _checkRemoved(entity: Entity, sinceTick: number) {
    return (
      this._removedComponents.length === 0 ||
      this._removedComponents.every((comp: AnyComponent) =>
        entity.isRemovedSince(comp, sinceTick)
      )
    );
  }
}
