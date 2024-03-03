import { Aspect, Entity } from "../core";
import { System } from ".";

export abstract class EntitySystem extends System {
  // protected entities: Entity[];
  _aspect: Aspect;

  constructor(aspect: Aspect) {
    super();
    this._aspect = aspect;
    // this.entities = [];
  }

  // accept(entity: Entity, components: AnyComponent[]): boolean {
  //   const present = this.entities.includes(entity);
  //   const valid = this.aspect.accept(components);
  //   if (!present && valid) {
  //     this.entities.push(entity);
  //     return true;
  //   } else if (present && !valid) {
  //     this.entities = this.entities.filter((sEntity) => sEntity !== entity);
  //   }
  //   return valid;
  // }

  accept(entity: Entity): boolean {
    return this._aspect.match(entity, this.lastTick);
  }

  // public removeEntities(entitiesToRemove: Entity[]) {
  //   this.entities = this.entities.filter(
  //     (entity) => !entitiesToRemove.includes(entity)
  //   );
  // }

  // public process(): void {
  //   if (this.isEnabled()) {
  //     this.beforeProcess();
  //     this.processEntities();
  //     this.afterProcess();
  //   }
  // }

  protected doProcess(): void {
    for (let e of this._aspect.entities(this.world, this.lastTick)) {
      this.processEntity(e);
    }
  }

  protected abstract processEntity(entity: Entity): void;

  // /* tslint:disable:no-empty */
  // public doProcess(): void {}
}
