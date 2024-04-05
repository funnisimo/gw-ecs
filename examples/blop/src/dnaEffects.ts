import type { GameEvent } from "./queues";
import { Aspect, Entity } from "gw-ecs/entity";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { findEmptyFloorTile } from "./map/utils";
import {
  Blop,
  EffectSprite,
  HealEffectSprite,
  Hero,
  Pickup,
  TeleportSprite,
  DamageSprite,
  EntityInfo,
  Effect,
  TILE_ASPECT,
  Tile,
  FLOOR,
  FLOOR_BUNDLE,
  Sprite,
} from "./comps";
import { type World } from "gw-ecs/world";
import { random, type Random } from "gw-utils/rng";
import { App } from "gw-utils/app";
import { flash } from "./fx/flash";
import { Game, Log } from "./uniques";
import { coloredName } from "./utils";
import { forCircle } from "gw-utils/xy";
import { MapChanged } from "./triggers";

export class TeleportEffect extends Effect {
  constructor() {
    super("Teleport", "teleports the owner to a new location on the world.");
  }

  apply(world: World, event: GameEvent, owner: Entity) {
    const posMgr = world.getUnique(PosManager);

    const newXY = findEmptyFloorTile(world);
    if (!newXY) {
      world.getUnique(Log).add(`${coloredName(owner)} failed to teleport.`);
      return true;
    }

    posMgr.set(owner, newXY.x, newXY.y);
    flash(world, newXY, TeleportSprite);

    // TODO - emit teleport event?
    world.getUnique(Log).add(`${coloredName(owner)} teleports.`);
    return true;
  }
}

export class HealEffect extends Effect {
  constructor() {
    super("Heal", "heals the owner 1 HP.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    if (!owner.has(Blop)) return false;
    const blop = owner.update(Blop)!;
    if (blop.maxHealth <= blop.health) {
      return false;
    }
    blop.health += 1;
    // TODO - add heal amount to event?
    // TODO - emit heal event?
    flash(world, owner.fetch(Pos)!, HealEffectSprite);
    world.getUnique(Log).add(`${coloredName(owner)} is healed for 1 HP.`);
    return true;
  }
}

export class HurtSelfEffect extends Effect {
  constructor() {
    super("HurtSelf", "injurs the owner 1 HP.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    if (!owner.has(Blop)) return false;
    const blop = owner.update(Blop)!;
    if (blop.health <= 0) {
      return false;
    }
    blop.health -= 1;
    flash(world, owner.fetch(Pos)!, DamageSprite);
    // TODO - add damage amount to event?
    // TODO - emit hurt event? (for onLoseLife?)
    world.getUnique(Log).add(`${coloredName(owner)} is hurt for 1 HP.`);
    return true;
  }
}

export const DestroyWallsSprite = new Sprite("%", "yellow", "cyan");

// destroywalls
export class DestroyWallsEffect extends Effect {
  constructor() {
    super("DestroyWalls", "destroys surrounding walls.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    forCircle(pos.x, pos.y, 2, (x, y) => {
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return; // Out of bounds
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove && !tile.permanent) {
        FLOOR_BUNDLE.applyTo(tileEntity, world);
      }
      flash(world, { x, y }, DestroyWallsSprite);
    });

    world.emitTrigger(new MapChanged()); // Need fov recalc
    world.getUnique(Game).changed = true;

    return true;
  }
}

// shock
// cleave
// summonally
// summondummy
// explode
// gaincharge
// shootlaser

export const effectClasses = [
  TeleportEffect,
  HealEffect,
  HurtSelfEffect,
  DestroyWallsEffect,
];

export function createRandomEffect(world: World, rng?: Random): Entity {
  rng = rng || random;
  const cls = rng.item(effectClasses);
  const effect = new cls();
  return world.create(
    EffectSprite,
    effect,
    new Pickup(pickupEffect),
    new EntityInfo(effect.name, "INTERRUPT_WHEN_SEEN, OBSERVE")
  );
}

export function pickupEffect(world: World, actor: Entity, item: Entity) {
  if (!item.has(Effect)) return;
  if (!actor.has(Hero)) return;

  const app = world.getUnique(App);
  app.show("add_dna", { world, entity: actor, chromosome: item });
  // TODO - run 'add_to_dna' scene
}
