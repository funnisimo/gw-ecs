import type { Entity } from "gw-ecs/entity/entity";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { Pos, PosManager } from "gw-ecs/utils/positions";
import { Aspect } from "gw-ecs/world";
import type { Level } from "gw-ecs/world/level";
import { Move } from "../comps/move";
import { COLLIDER_ASPECT, CollisionManager } from "gw-ecs/utils/collisions";
import { Game } from "../uniques";
import { TILE_ASPECT, Tile } from "../comps";
import { GameEvent } from "../queues";

export class MoveSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }

  processEntity(
    level: Level,
    entity: Entity,
    time: number,
    delta: number
  ): void {
    const game = level.getUnique(Game);
    const posMgr = level.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    const dxy = entity.remove(Move)!.dir;

    let slide = false;

    do {
      const newX = pos.x + dxy[0];
      const newY = pos.y + dxy[1];

      const others = posMgr.getAt(newX, newY, COLLIDER_ASPECT);
      if (others.length > 0) {
        if (level.getUnique(CollisionManager).collide(entity, others)) {
          game.changed = true; // Force redraw
          return;
        }
      }

      posMgr.set(entity, newX, newY);
      game.changed = true; // Force redraw
      // need fov update
      level.push(new GameEvent(entity, "move", { dir: dxy }));

      // check for pickups

      let tileEntity = posMgr.firstAt(newX, newY, TILE_ASPECT)!;
      const tile = tileEntity.fetch(Tile)!;

      // check for hurt
      // check for stairs
      slide = tile.slide;

      // trigger move (Move...)
      // trigger tile change (StepOn...)
    } while (slide);
  }
}
