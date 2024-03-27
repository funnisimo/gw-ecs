import type { Entity } from "gw-ecs/entity/entity";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Aspect } from "gw-ecs/world";
import type { World } from "gw-ecs/world/world";
import { Move } from "../comps/move";
import { COLLIDER_ASPECT, CollisionManager } from "gw-ecs/common/collisions";
import { Game } from "../uniques";
import { TILE_ASPECT, Tile } from "../comps";
import { GameEvent } from "../queues";

export class MoveSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }

  shouldRun(world: World, _time: number, _delta: number): boolean {
    const game = world.getUnique(Game);
    return game.ready;
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const game = world.getUnique(Game);
    const posMgr = world.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    const dxy = entity.remove(Move)!.dir;

    let slide = false;

    do {
      const newX = pos.x + dxy[0];
      const newY = pos.y + dxy[1];

      const others = posMgr.getAt(newX, newY, COLLIDER_ASPECT);
      if (others.length > 0) {
        if (world.getUnique(CollisionManager).collide(entity, others)) {
          game.changed = true; // Force redraw
          break;
        }
      }

      posMgr.set(entity, newX, newY);
      game.changed = true; // Force redraw
      // need fov update
      world.pushQueue(
        new GameEvent(entity, "move", { dir: dxy, pos: pos.clone() })
      );

      // check for pickups

      let tileEntity = posMgr.firstAt(newX, newY, TILE_ASPECT)!;
      const tile = tileEntity.fetch(Tile)!;

      // check for hurt
      // check for stairs
      slide = tile.slide;

      // trigger move (Move...)
      // trigger tile change (StepOn...)
    } while (slide);

    // NOTE - Bumping into a wall is a turn right now
    //      - To change, check a flag that gets set on successful move (when event fired)
    world.pushQueue(new GameEvent(entity, "turn", { time: 0 }));

    // TODO - reschedule actor
  }
}
