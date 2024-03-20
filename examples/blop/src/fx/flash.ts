import type { Level } from "gw-ecs/world";
import type { XY } from "gw-utils";
import { FX, Sprite } from "../comps";
import { PosManager } from "gw-ecs/common/positions";
import { Timers } from "gw-utils/app";
import { Game } from "../uniques";

export function flash(level: Level, pos: XY, sprite: Sprite, ms: number = 150) {
  const posMgr = level.getUnique(PosManager);
  const timers = level.getUnique(Timers);
  const game = level.getUnique(Game);

  const entity = level.create(sprite, new FX());
  posMgr.set(entity, pos.x, pos.y);
  game.changed = true;

  timers.setTimeout(() => {
    level.destroyNow(entity);
    game.changed = true;
  }, ms);
}
