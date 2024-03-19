import { type Random, random } from "gw-utils/rng";
import { xy } from "gw-utils";
import type { GameEvent } from "../queues";
import type { Entity } from "gw-ecs/entity/entity";
import { NAMED_DIRS, type Loc } from "gw-utils/xy";
import type { World } from "gw-ecs/world";
import { Pos, PosManager } from "gw-ecs/utils/positions";
import { GRASS, PATCH_TILES, TILE_ASPECT, Tile } from "./tile";
import { capitalize } from "gw-utils/text";
import { TriggerSprite } from "./sprite";
import { Pickup } from "./pickup";
import type { Level } from "gw-ecs/world/level";

export type TriggerFn = (event: GameEvent, owner: Entity) => boolean;

export abstract class Trigger {
  name: string;
  description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  abstract matches(level: Level, event: GameEvent, owner: Entity): boolean;
}

export class WaitTrigger extends Trigger {
  constructor() {
    super("OnWait", "each time its owner waits.");
  }

  matches(level: Level, event: GameEvent, owner: Entity): boolean {
    return event.type === "wait" && owner === event.entity;
  }
}

export class MoveTrigger extends Trigger {
  constructor() {
    super("OnMove", "each time its owner moves.");
  }

  matches(level: Level, event: GameEvent, owner: Entity): boolean {
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

  matches(level: Level, event: GameEvent, owner: Entity): boolean {
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

  matches(level: Level, event: GameEvent, owner: Entity): boolean {
    if (event.type !== "move" || owner !== event.entity) return false;
    const pos = owner.fetch(Pos)!;
    const posMgr = level.getUnique(PosManager);

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

  matches(level: Level, event: GameEvent, owner: Entity): boolean {
    if (event.type !== "move" || owner !== event.entity) return false;
    const pos = owner.fetch(Pos)!;
    const posMgr = level.getUnique(PosManager);

    const nowTileEntity = posMgr.firstAt(pos.x, pos.y, TILE_ASPECT);
    return !!nowTileEntity && nowTileEntity.fetch(Tile) === this.tile;
  }
}

export class EveryXTrigger extends Trigger {
  count: number;
  x: number;

  constructor() {
    const x = 7;
    super(`OnEvery${x}Turns`, `every ${x} turns.`);
    this.x = x;
    this.count = 0;
  }

  matches(level: Level, event: GameEvent, owner: Entity): boolean {
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

// turnaround
// swap
// onattack   // removed(attack).with(dna)
// onkill     // added(killed).without(ally, hero)
// onloselife // removed(damage).with(dna)
// ontrigger  // ????
// onstepnearally // updated(pos).with(dna)
// onallydeath    // added(killed).with(ally).without(hero)

export const triggerClasses = [
  WaitTrigger,
  MoveTrigger,
  MoveDirTrigger,
  EveryXTrigger,
  StepOnTrigger,
  ChangeTileTypeTrigger,
];

export function createRandomTrigger(level: Level, rng?: Random): Entity {
  rng = rng || random;
  const cls = rng.item(triggerClasses);
  const trigger = new cls();
  return level.create(TriggerSprite, trigger, Pickup);
}
