import type { Entity } from "gw-ecs/entity/entity";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Aspect } from "gw-ecs/entity";
import type { World } from "gw-ecs/world/world";
import { Move } from "../comps/move";
import {
  COLLIDER_ASPECT,
  Collider,
  CollisionManager,
} from "gw-ecs/common/collisions";
import { FOV, UiHelper, Game, Log } from "../uniques";
import {
  AppearSprite,
  EntityInfo,
  TILE_ASPECT,
  Tile,
  removeAction,
  takeTurn,
} from "../comps";
import { GameEvent } from "../queues";
import * as XY from "gw-utils/xy";
import { coloredName } from "../comps";
import { flash } from "../fx/flash";
import { Interrupt } from "../triggers";

export class MoveSystem extends EntitySystem {
  constructor() {
    super(new Aspect(Move, Pos));
  }

  // shouldRun(world: World, _time: number, _delta: number): boolean {
  //   const game = world.getUnique(Game);
  //   return game.ready;
  // }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const focus = world.getUnique(UiHelper);
    const game = world.getUnique(Game);
    const posMgr = world.getUnique(PosManager);
    const pos = entity.fetch(Pos)!;

    const dxy = removeAction(entity, Move)!.dir;
    pos.setFacing(dxy);

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

      const oldXY = XY.newXY(pos);
      posMgr.set(entity, newX, newY);
      game.changed = true; // Force redraw
      // need fov update
      world.pushQueue(
        new GameEvent(entity, "move", { dir: dxy, pos: pos.clone() })
      );

      // remove from path if appropriate
      // TODO - This should go elsewhere
      if (entity === game.hero && focus.path && focus.path.length) {
        if (XY.equals(pos, focus.path[0])) {
          focus.path.shift();
        }
      }

      // [X] - Did we become visible?  Should we interupt the hero?
      // if (game.hero!.has(TravelTo)) {
      const fov = world.getUnique(FOV);
      if (!fov.isVisible(oldXY.x, oldXY.y) && fov.isVisible(pos.x, pos.y)) {
        const info = entity.update(EntityInfo);
        if (info) {
          if (info.shouldInterruptWhenSeen()) {
            world.emitTrigger(new Interrupt(game.hero!));
            world.getUnique(Log).add(`A ${coloredName(entity)} appears.`);
            flash(world, pos, AppearSprite);
          }
          info.seen();
        }
      }
      // }

      let tileEntity = posMgr.firstAt(newX, newY, TILE_ASPECT)!;
      const tile = tileEntity.fetch(Tile)!;

      // check for hurt
      // check for stairs
      slide = tile.slide;

      // trigger move (Move...)
      // trigger tile change (StepOn...)
    } while (slide);

    takeTurn(world, entity);
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
