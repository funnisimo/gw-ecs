import type { Entity } from "gw-ecs/entity/entity";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Aspect } from "gw-ecs/world";
import type { World } from "gw-ecs/world/world";
import { Move } from "../comps/move";
import {
  COLLIDER_ASPECT,
  Collider,
  CollisionManager,
} from "gw-ecs/common/collisions";
import { Game } from "../uniques";
import { TILE_ASPECT, Tile, removeAction } from "../comps";
import { GameEvent } from "../queues";
import * as XY from "gw-utils/xy";

export class MoveSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }

  // shouldRun(world: World, _time: number, _delta: number): boolean {
  //   const game = world.getUnique(Game);
  //   return game.ready;
  // }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const game = world.getUnique(Game);
    const posMgr = world.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    const dxy = removeAction(entity, Move)!.dir;

    let slide = false;

    do {
      const newX = pos.x + XY.x(dxy);
      const newY = pos.y + XY.y(dxy);

      const others = posMgr.getAt(newX, newY, COLLIDER_ASPECT);
      if (others.length > 0) {
        if (world.getUnique(CollisionManager).collide(entity, others)) {
          game.changed = true; // Force redraw
          return; // turn handled by colliders
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

    world.pushQueue(new GameEvent(entity, "turn", { time: 0 }));
  }
}

/**
 * Check to see if we can move to a square by checking for colliders that we would
 * set off.
 * @param world
 * @param entity
 * @param pos
 * @returns
 */
export function getPotentialColliders(
  world: World,
  entity: Entity,
  pos: XY.XY
): Collider[] {
  const myCollider = entity.fetch(Collider);
  if (!myCollider) return [];

  const posMgr = world.getUnique(PosManager);
  const entities = posMgr.getAt(pos.x, pos.y, new Aspect(Collider));
  const colliders = entities.map((e) => e.fetch(Collider)!);
  return colliders.filter((c) => c.match(myCollider.tags));
}
