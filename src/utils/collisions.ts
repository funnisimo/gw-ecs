import { Entity } from "../entity/entity.js";
import { Aspect } from "../world/aspect.js";
import { World } from "../world/world.js";

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

export class CollisionManager {
  _world!: World;
  _collisions: Collision[];

  constructor() {
    this._collisions = [];
  }

  init(world: World): CollisionManager {
    world.setGlobal(this); // just in case
    world.registerComponent(Collider); // just in case
    this._world = world;
    return this;
  }

  register(actor: Aspect, target: Aspect, collideFn: CollideFn) {
    this._collisions.push(new Collision(actor, target, collideFn));
  }

  collide(actor: Entity, target: Entity): boolean {
    return this._collisions.some(
      (c) =>
        c.actor.match(actor) &&
        c.target.match(target) &&
        c.fn(actor, target, this._world) !== false
    );
  }
}
