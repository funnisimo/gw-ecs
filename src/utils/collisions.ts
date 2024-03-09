import { Entity } from "../entity/entity.js";
import { Aspect } from "../world/aspect.js";
import { World, WorldInit } from "../world/world.js";

export class Collider {
  tags: string[];

  constructor(tag: string, ...tags: string[]) {
    tags.unshift(tag);
    this.tags = tags;
  }

  match(otherTags: string[]) {
    for (let tag of this.tags) {
      if (tag.startsWith("!")) {
        if (otherTags.includes(tag.slice(1))) {
          return false;
        }
      } else {
        if (!otherTags.includes(tag)) {
          return false;
        }
      }
    }
    return true;
  }
}

export const COLLIDER_ASPECT = new Aspect(Collider);

class Collision {
  actor: string[];
  target: string[];
  fn: CollideFn;

  constructor(
    actor: string | string[],
    target: string | string[],
    fn: CollideFn
  ) {
    this.actor = Array.isArray(actor) ? actor : [actor];
    this.target = Array.isArray(target) ? target : [target];
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
    actor: string | string[],
    target: string | string[],
    collideFn: CollideFn
  ): CollisionManager {
    this._collisions.push(new Collision(actor, target, collideFn));
    return this;
  }

  collide(actor: Entity, target: Entity | Entity[]): boolean {
    if (Array.isArray(target)) {
      return target.some((e) => this.collide(actor, e));
    }
    const actorCollider = actor.fetch(Collider);
    const targetCollider = target.fetch(Collider);

    return (
      !!actorCollider &&
      !!targetCollider &&
      this._collisions.some(
        (c) =>
          actorCollider.match(c.actor) &&
          targetCollider.match(c.target) &&
          c.fn(actor, target, this._world) !== false
      )
    );
  }
}
