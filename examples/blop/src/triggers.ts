import { type Random, random } from "gw-utils/rng";
import { xy } from "gw-utils";
import type { GameEvent } from "./queues";
import { Entity } from "gw-ecs/entity";
import { NAMED_DIRS, type Loc } from "gw-utils/xy";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { PATCH_TILES, TILE_ASPECT, Tile } from "./comps";
import { capitalize } from "gw-utils/text";
import { Trigger, TriggerSprite } from "./comps";
import { Pickup, EntityInfo, Hero } from "./comps";
import { type World } from "gw-ecs/world";
import { App } from "gw-utils/app";

export class WaitTrigger extends Trigger {
  constructor() {
    super("OnWait", "each time its owner waits.");
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return event.type === "wait" && owner === event.entity;
  }
}

export class MoveTrigger extends Trigger {
  constructor() {
    super("OnMove", "each time its owner moves.");
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return event.type === "move" && owner === event.entity;
  }
}

export class MoveDirTrigger extends Trigger {
  dir: Loc;
  constructor() {
    const dir = random.item(["left", "right", "up", "down"]);
    super("OnMove" + capitalize(dir), `each time its owner moves ${dir}.`);
    this.dir = NAMED_DIRS[dir];
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return (
      event.type === "move" &&
      owner === event.entity &&
      !!event.dir &&
      xy.equals(event.dir, this.dir)
    );
  }
}

export class ChangeTileTypeTrigger extends Trigger {
  constructor() {
    super(
      "OnChangeTileType",
      "each time its owner steps onto a new tile type."
    );
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    if (event.type !== "move" || owner !== event.entity) return false;
    const pos = owner.fetch(Pos)!;
    const posMgr = world.getUnique(PosManager);

    const lastTileEntity = posMgr.firstAt(pos.lastX, pos.lastY, TILE_ASPECT);
    const nowTileEntity = posMgr.firstAt(pos.x, pos.y, TILE_ASPECT);

    return (
      !!lastTileEntity &&
      !!nowTileEntity &&
      lastTileEntity.fetch(Tile) !== nowTileEntity.fetch(Tile)
    );
  }
}

export class StepOnTrigger extends Trigger {
  tile: Tile;

  constructor() {
    const tile = random.item(PATCH_TILES);
    super(
      "OnStepOn" + tile.name,
      `each time its owner steps on ${tile.name.toLowerCase()}.`
    );
    this.tile = tile;
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    if (event.type !== "move" || owner !== event.entity) return false;
    const pos = owner.fetch(Pos)!;
    const posMgr = world.getUnique(PosManager);

    const nowTileEntity = posMgr.firstAt(pos.x, pos.y, TILE_ASPECT);
    return !!nowTileEntity && nowTileEntity.fetch(Tile) === this.tile;
  }
}

export class EveryXTrigger extends Trigger {
  count: number;
  x: number;

  constructor() {
    const x = 7;
    super(`Every${x}Turns`, `every ${x} turns.`);
    this.x = x;
    this.count = 0;
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    if (event.type === "turn" && event.entity === owner) {
      this.count += 1;
      if (this.count >= this.x) {
        this.count = 0;
        return true;
      }
    }
    return false;
  }
}

export class AttackTrigger extends Trigger {
  constructor() {
    super("OnAttack", "each time its owner attacks.");
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return event.type === "attack" && owner === event.entity;
  }
}

export class KillTrigger extends Trigger {
  constructor() {
    super("OnKill", "each time its owner kills another.");
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return event.type === "kill" && owner === event.entity;
  }
}

export class DeathTrigger extends Trigger {
  constructor() {
    super("OnMyDeath", "when its owner dies.");
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return event.type === "kill" && owner === event.target;
  }
}

export class HurtTrigger extends Trigger {
  constructor() {
    super("OnHurt", "when its owner loses health.");
  }

  matches(world: World, event: GameEvent, owner: Entity): boolean {
    return (
      event.type === "attack" && owner === event.target && event.damage > 0
    );
  }
}

// turnaround ???
// turn ???
// swap // ?!?!?!
// ontrigger  // event.entity === owner && triggered effect already ?!?!?
// onstepnearally // ??? expensive!!!  type === 'move' && DIRS4.some( (d) => posMgr.hasAt(plus(d, myPos), ALLY_ASPECT))
// onallydeath    // ??? type === 'kill' && target.has(Ally)

export const triggerClasses = [
  WaitTrigger,
  MoveTrigger,
  MoveDirTrigger,
  EveryXTrigger,
  StepOnTrigger,
  ChangeTileTypeTrigger,
  AttackTrigger,
  KillTrigger,
  DeathTrigger,
  HurtTrigger,
];

export function createRandomTrigger(world: World, rng?: Random): Entity {
  rng = rng || random;
  const cls = rng.item(triggerClasses);
  const trigger = new cls();
  return world.create(
    TriggerSprite,
    trigger,
    new Pickup(pickupTrigger),
    new EntityInfo(trigger.name, "INTERRUPT_WHEN_SEEN, OBSERVE")
  );
}

export function pickupTrigger(world: World, actor: Entity, item: Entity) {
  if (!item.has(Trigger)) return;
  if (!actor.has(Hero)) return;

  const app = world.getUnique(App);
  app.show("add_dna", { world, entity: actor, chromosome: item });
  // TODO - run 'add_to_dna' scene
}
