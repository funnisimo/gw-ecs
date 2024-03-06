import { Entity } from "../entity/entity.js";
import { Aspect } from "../world/aspect.js";
import { World, WorldInit } from "../world/world.js";

export class Collider {}

export const COLLIDER_ASPECT = new Aspect(Collider);

class Collision {
  actor: Aspect;
  target: Aspect;
  fn: CollideFn;

  constructor(actor: Aspect, target: Aspect, fn: CollideFn) {
    this.actor = actor;
    this.target = target;
    this.fn = fn;
  }
}

export type CollideFn = (
  actor: Entity,
  target: Entity,
  world: World
) => false | any;

export class CollisionManager implements WorldInit {
  _world!: World;
  _collisions: Collision[];

  constructor() {
    this._collisions = [];
  }

  worldInit(world: World) {
    world.registerComponent(Collider); // just in case
    this._world = world;
  }

  register(
    actor: Aspect,
    target: Aspect,
    collideFn: CollideFn
  ): CollisionManager {
    this._collisions.push(new Collision(actor, target, collideFn));
    return this;
  }

  collide(actor: Entity, target: Entity | Entity[]): boolean {
    if (Array.isArray(target)) {
      return target.some((e) => this.collide(actor, e));
    }
    return this._collisions.some(
      (c) =>
        c.actor.match(actor) &&
        c.target.match(target) &&
        c.fn(actor, target, this._world) !== false
    );
  }
}
