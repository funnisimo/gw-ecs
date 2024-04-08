import { SimpleComponent } from "../component";
import { type World } from "../world";
import { Entity } from "./entity";

export type ComponentFn<T> = (
  world: World,
  entity: Entity,
  ...args: any[]
) => T | undefined;
export type AnyComponentFn = ComponentFn<any>;

export type ComponentArg<T> = T | SimpleComponent<T> | ComponentFn<T>;
export type AnyComponentArg = any | ComponentFn<any>;

export interface ComponentObj {
  [key: string]: AnyComponentArg;
}

export class Bundle {
  _comps: AnyComponentArg[];

  constructor(...args: AnyComponentArg[]) {
    this._comps = args;
  }

  with(comp: AnyComponentArg): this {
    this._comps.push(comp);
    return this;
  }

  static fromObject(obj: ComponentObj): Bundle {
    const bundle = new Bundle();
    Object.values(obj).forEach((v) => {
      bundle.with(v);
    });
    return bundle;
  }

  create(world: World, ...args: any[]): Entity {
    const entity = world.create();
    this.applyTo(entity, world, ...args);
    return entity;
  }

  applyTo(entity: Entity, world: World, ...args: any[]) {
    for (let c of this._comps) {
      if (typeof c === "function") {
        if (world.hasStore(c)) {
          const comp = new c();
          entity.set(comp);
        } else {
          const comp = c(world, entity, ...args);
          if (comp) {
            entity.set(comp);
          }
        }
      } else {
        entity.set(c);
      }
    }
  }
}
