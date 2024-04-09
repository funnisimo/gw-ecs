import { Schedule } from "gw-ecs/common";
import type { Component } from "gw-ecs/component";
import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { getPath, setPath } from "gw-utils/object";

export type AiFn = (
  world: World,
  entity: Entity,
  time: number,
  delta: number
) => boolean;

export class Actor {
  ai: AiFn[] = [];
  actTime: number; // Default act time - change this to vary actor speeds (100 = normal, 50 = 2 x faster, 200 = 2 x slower)
  ready: boolean = false;
  scheduled: boolean = false; // Tracks whether or not this actor was rescheduled - to find logic errors in your systems
  config: Record<string, any> = {};

  constructor(time: number, ...fns: AiFn[]);
  constructor(...fns: AiFn[]);
  constructor(...args: any[]) {
    this.ready = false;

    if (typeof args[0] === "number") {
      this.actTime = args.shift();
    } else {
      this.actTime = 100;
    }

    args.forEach((fn) => {
      if (typeof fn === "function") {
        this.ai.push(fn);
      }
    });
  }

  withConfig(config: Record<string, any>): this {
    this.config = config;
    return this;
  }

  setConfig(path: string, value: any): this {
    setPath(this.config, path, value);
    return this;
  }

  getConfig(path: string): any | undefined {
    return getPath(this.config, path);
  }

  getConfigOr(path: string, missing: any): any {
    const val = getPath(this.config, path);
    if (val !== undefined) return val;
    return missing;
  }
}

export function addAction(entity: Entity, action: any) {
  const actor = entity.update(Actor);
  if (actor) {
    actor.ready = true;
  }
  entity.set(action);
}

export function removeAction<T>(
  entity: Entity,
  comp: Component<T>
): T | undefined {
  const actor = entity.update(Actor);
  if (actor) {
    actor.ready = false;
  }
  return entity.remove(comp);
}

export function noTurn(world: World, entity: Entity) {
  const schedule = world.getUnique(Schedule);
  schedule.restore(entity);

  // To help find actors that are not being rescheduled
  // TODO - Remove once things are working
  const actor = entity.fetch(Actor);
  if (actor) {
    actor.scheduled = true;
    // TODO : actor.ready = false; ?????
  }
}

export function takeTurn(world: World, entity: Entity, actTime?: number) {
  if (actTime === undefined || actTime < 0) {
    const actor = entity.fetch(Actor);
    if (actor) {
      actTime = actor.actTime;
    }
  }
  console.log("- entity turn", entity.index, actTime);
  const schedule = world.getUnique(Schedule);
  schedule.add(entity, actTime);

  // To help find actors that are not being rescheduled
  // TODO - Remove once things are working
  const actor = entity.fetch(Actor);
  if (actor) {
    actor.scheduled = true;
  }
}
