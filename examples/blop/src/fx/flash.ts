import type { World } from "gw-ecs/world";
import type { XY } from "gw-utils";
import { FX, Sprite } from "../comps";
import { PosManager } from "gw-ecs/common/positions";
import { Timers } from "gw-utils/app";
import { Game } from "../uniques";

export function flash(world: World, pos: XY, sprite: Sprite, ms: number = 150) {
  const posMgr = world.getUnique(PosManager);
  const timers = world.getUnique(Timers);
  const game = world.getUnique(Game);

  const entity = world.create(sprite, new FX());
  posMgr.set(entity, pos.x, pos.y);
  game.changed = true;

  timers.setTimeout(() => {
    world.destroyNow(entity);
    game.changed = true;
  }, ms);
}
