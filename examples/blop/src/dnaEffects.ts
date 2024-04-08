import type { GameEvent } from "./queues";
import { Entity } from "gw-ecs/entity";
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
  Sprite,
  BLOP_ASPECT,
} from "./comps";
import { type World } from "gw-ecs/world";
import { Random, random } from "gw-utils/rng";
import { App } from "gw-utils/app";
import { delayedFlash, flash } from "./fx/flash";
import { Game, Log } from "./uniques";
import { coloredName, facingDir } from "./utils";
import { DIRS, DIRS4, dirSpread, equals, forCircle } from "gw-utils/xy";
import { MapChanged } from "./triggers";
import { applyAttack } from "./systems/attack";
import * as Grid from "gw-utils/grid";
import * as Constants from "./constants";
import { FLOOR_BUNDLE, RUBBLE_BUNDLE } from "./tiles";
import { HERO_DUMMY_BUNDLE } from "./blops";

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
    // TODO - Blink?
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

// destroywalls
export const DestroyWallsSprite = new Sprite("%", "yellow", "cyan");
export class DestroyWallsEffect extends Effect {
  constructor() {
    super("DestroyWalls", "destroys surrounding walls.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    forCircle(pos.x, pos.y, 2, (x, y, d) => {
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return; // Out of bounds
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove && !tile.permanent) {
        RUBBLE_BUNDLE.applyTo(tileEntity, world);
      }
      delayedFlash(world, { x, y }, DestroyWallsSprite, 25 * d);
    });

    world.emitTrigger(new MapChanged()); // Need fov recalc
    world.getUnique(Game).changed = true;

    return true;
  }
}

// swirl - aka cleave
export const SwirlSprite = new Sprite("@", "white", "light_cyan");
export class SwirlEffect extends Effect {
  constructor() {
    super("Swirl", "attacks all surrounding cells.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    let index = DIRS4.findIndex((l) => equals(l, pos.facing()));
    if (index < 0) index = 0;

    // TODO - start with dir after dir to target
    //      - end back at starting spot with last swirl attack
    for (let i = 1; i < 5; ++i) {
      const ix = (index + i) % 4;
      const [dx, dy] = DIRS4[ix];
      const x = pos.x + dx;
      const y = pos.y + dy;
      const blopEntity = posMgr.firstAt(x, y, BLOP_ASPECT);
      delayedFlash(world, { x, y }, SwirlSprite, 25 * i).then(() => {
        if (blopEntity) {
          applyAttack(world, owner, blopEntity, 2, "swirls");
        }
      });
    }

    return true;
  }
}

// gaincharge
export const ChargeEffectSprite = new Sprite("↑", "white", "light_orange");
export class ChargeEffect extends Effect {
  constructor() {
    super("Charge", "charges the owner.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    if (!owner.has(Blop)) return false;
    const blop = owner.update(Blop)!;

    blop.charge = blop.charge + 1;
    if (blop.charge > blop.maxCharge) {
      blop.charge = blop.maxCharge;
      return true;
    }
    flash(world, owner.fetch(Pos)!, ChargeEffectSprite);
    world.getUnique(Log).add(`${coloredName(owner)} is charged.`);
    return true;
  }
}

// swipe
export const SwipeSprite = new Sprite("/", "green", "light_blue");
export class SwipeEffect extends Effect {
  constructor() {
    super("Swipe", "attacks all cells in front of owner.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    const dir = pos.facing();
    let dirs = dirSpread(dir);
    dirs = [dirs[1], dirs[0], dirs[2]];

    // TODO - go from one side to the other, indexes: (1,0,2)
    dirs.forEach(([dx, dy], i) => {
      const x = pos.x + dx;
      const y = pos.y + dy;
      const blopEntity = posMgr.firstAt(x, y, BLOP_ASPECT);
      delayedFlash(world, { x, y }, SwipeSprite, 25 * i).then(() => {
        if (blopEntity) {
          applyAttack(world, owner, blopEntity, 2, "swipes");
        }
      });
    });

    return true;
  }
}

// extend - aka shootlaser
export const ExtendSpriteVert = new Sprite("|", "green", "light_blue");
export const ExtendSpriteHoriz = new Sprite("-", "green", "light_blue");
export const ExtendSpriteDiagUp = new Sprite("/", "green", "light_blue");
export const ExtendSpriteDiagDown = new Sprite("\\", "green", "light_blue");

export class ExtendEffect extends Effect {
  dist: number;
  constructor(dist = 4) {
    super("Extend", "attacks all cells in front of owner.");
    this.dist = dist;
  }

  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    const dir = pos.facing();

    let sprite = ExtendSpriteDiagUp;
    if (dir[0] == 0) {
      sprite = ExtendSpriteVert;
    } else if (dir[1] == 0) {
      sprite = ExtendSpriteHoriz;
    } else if (dir[0] * dir[1] < 0) {
      sprite = ExtendSpriteDiagDown;
    }

    let x = pos.x;
    let y = pos.y;

    // TODO - go out one step at a time
    //      - space flashes by 50 ms
    //      - use Timers.setTimeout(50, () => { ... });
    for (let i = 0; i < this.dist; ++i) {
      x += dir[0];
      y += dir[1];

      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT)!;
      const tile = tileEntity.fetch(Tile)!;
      // TODO - Do we flash the first wall we hit?
      if (tile.blocksMove) break;

      const blopEntity = posMgr.firstAt(x, y, BLOP_ASPECT);
      delayedFlash(world, { x, y }, sprite, i * 25).then(() => {
        if (blopEntity) {
          applyAttack(world, owner, blopEntity, 2, "extends");
        }
      });
    }

    return true;
  }
}

// explode
export const ExplodeSprite = new Sprite("%", "red", "yellow");
export class ExplodeEffect extends Effect {
  constructor() {
    super("Explode", "explodes, damaging all around.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    const grid = Grid.alloc(Constants.MAP_WIDTH, Constants.MAP_HEIGHT, 0);

    grid.walkFrom(pos.x, pos.y, (x, y, v, d) => {
      if (d > 3) return false;
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return false; // Out of bounds
      const tile = tileEntity.fetch(Tile)!;

      const blopEntity = posMgr.firstAt(x, y, BLOP_ASPECT);

      delayedFlash(world, { x, y }, ExplodeSprite, 25 * d).then(() => {
        if (blopEntity) {
          applyAttack(world, owner, blopEntity, 3, "explodes, damaging");
        }
      });
      return !tile.blocksMove;
    });

    return true;
  }
}

// shock
export const ShockSprite = new Sprite("!", "white", "light_teal");
export class ShockEffect extends Effect {
  constructor() {
    super("Shock", "shocks any connected blops and travels through water.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    const grid = Grid.alloc(Constants.MAP_WIDTH, Constants.MAP_HEIGHT, 0);

    grid.walkFrom(pos.x, pos.y, false, (x, y, v, d) => {
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT);
      if (!tileEntity) return false; // Out of bounds

      const blopEntity = posMgr.firstAt(x, y, BLOP_ASPECT);

      const tile = tileEntity.fetch(Tile)!;
      if (tile.shock || !!blopEntity) {
        delayedFlash(world, { x, y }, ShockSprite, 25 * d).then(() => {
          if (blopEntity && blopEntity !== owner) {
            applyAttack(world, owner, blopEntity, 1, "shocks");
          }
        });
      }

      return tile.shock || !!blopEntity;
    });

    return true;
  }
}

// summon dummy
export class SummonDummyEffect extends Effect {
  constructor() {
    super("SummonDummy", "summons a dummy blop.");
  }
  apply(world: World, event: GameEvent, owner: Entity): boolean {
    const posMgr = world.getUnique(PosManager);
    const pos = owner.fetch(Pos)!;

    const choices = DIRS.filter((dir) => {
      const x = pos.x + dir[0];
      const y = pos.y + dir[1];

      // No spawn in walls
      const tileEntity = posMgr.firstAt(x, y, TILE_ASPECT)!;
      const tile = tileEntity.fetch(Tile)!;
      if (tile.blocksMove) return false;

      // Only spawn if no other blop there
      return !posMgr.hasAt(x, y, BLOP_ASPECT);
    });

    if (choices.length == 0) return false;

    const rng = world.getUnique(Random) || random;
    const dir = rng.item(choices);

    const dummyEntity = HERO_DUMMY_BUNDLE.create(world);
    posMgr.set(dummyEntity, pos.x + dir[0], pos.y + dir[1]);

    world
      .getUnique(Log)
      .add(`${coloredName(owner)} summons a ${coloredName(dummyEntity)}.`);

    world.getUnique(Game).changed = true;

    return true;
  }
}

// summon ally

export const effectClasses = [
  TeleportEffect,
  HealEffect,
  HurtSelfEffect,
  DestroyWallsEffect,
  SwirlEffect,
  ChargeEffect,
  SwipeEffect,
  ExtendEffect,
  ExplodeEffect,
  ShockEffect,
  SummonDummyEffect,
];

// TODO - Different weights
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
