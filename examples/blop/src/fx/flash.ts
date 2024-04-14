import type { World } from "gw-ecs/world";
import type { XY } from "gw-utils";
import { FX, Sprite } from "../comps";
import { PosManager } from "gw-ecs/common/positions";
import { Timers } from "gw-utils/app";
import { FOV, Game } from "../uniques";

export type ThenFn = (val: any) => any;

export class Thenable {
  fns: ThenFn[];

  constructor() {
    this.fns = [];
  }

  then(fn: ThenFn): this {
    this.fns.push(fn);
    return this;
  }

  resolve(initialValue: any = undefined): any {
    return this.fns.reduce((out, fn) => fn(out), initialValue);
  }
}

export function flash(
  world: World,
  pos: XY,
  sprite: Sprite,
  ms: number = 150
): Thenable {
  const posMgr = world.getUnique(PosManager);
  const timers = world.getUnique(Timers);
  const game = world.getUnique(Game);
  const fov = world.getUnique(FOV);

  if (fov && !fov.isVisible(pos.x, pos.y)) {
    console.log("** OFF SCREEN FX **");
    ms = 0;
  }

  const entity = world.create(sprite, new FX());
  posMgr.set(entity, pos.x, pos.y);
  game.changed = true;

  const thenable = new Thenable();

  timers.setTimeout(() => {
    world.destroyNow(entity);
    game.changed = true;
    thenable.resolve();
  }, ms);

  return thenable;
}

export function delayedFlash(
  world: World,
  pos: XY,
  sprite: Sprite,
  delay: number,
  ms: number = 150
): Thenable {
  const posMgr = world.getUnique(PosManager);
  const timers = world.getUnique(Timers);
  const game = world.getUnique(Game);

  const thenable = new Thenable();

  timers.setTimeout(() => {
    const entity = world.create(sprite, new FX());
    posMgr.set(entity, pos.x, pos.y);
    game.changed = true;

    timers.setTimeout(() => {
      world.destroyNow(entity);
      game.changed = true;
      thenable.resolve();
    }, ms);
  }, delay);

  return thenable;
}
