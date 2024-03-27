import { World } from "gw-ecs/world";
import {
  Blop,
  BumpSprite,
  Effect,
  FX,
  Hero,
  Move,
  Name,
  Pickup,
  Sprite,
  Tile,
  Trigger,
  coloredName,
} from "./comps";
import { nextLevel } from "./map/nextLevel";
import { CollisionManager } from "gw-ecs/common/collisions";
import {
  FovSystem,
  MoveSystem,
  PickupSystem,
  heroMoved,
  heroTeleported,
} from "./systems";
import { FOV, Game, notifyFovWhenTilesChange } from "./uniques";
import { GameEvent } from "./queues";
import { EventSystem } from "./systems/events";
import { DNA } from "./comps/dna";
import { Timers } from "gw-utils/app";
import { TimerSystem } from "./systems/timers";
import { flash } from "./fx/flash";
import type { Entity } from "gw-ecs/entity";
import { Pos } from "gw-ecs/common/positions";
import { MaintainWorld, RunSystemSet } from "gw-ecs/common";
import { SystemSet } from "gw-ecs/system";
import { FocusHelper } from "./uniques";
import * as Constants from "./constants";
import { Log } from "./uniques/log";

function blockedMove(actor: Entity, target: Entity, world: World) {
  world.getUnique(Log).add("#{red}Blocked#{}");
  flash(world, target.fetch(Pos)!, BumpSprite, 150);
  // Does it count as turn for actor (esp hero)?  Check move system.
  return true; // We handled the collision
}

export function gotoNextLevel(world: World) {
  nextLevel(world);
  const focus = world.getUnique(FocusHelper);
  const game = world.getUnique(Game);
  focus.reset(world, game.hero!.fetch(Pos)!);
  game.changed = true;
  return true; // We handled the collision
}

function gameReady(world: World) {
  const timersReady = world.getUnique(Timers)!.length == 0;
  const userReady = world.getUnique(Game)!.ready;
  return timersReady && userReady;
}

function sayHello(actor: Entity, target: Entity, world: World) {
  world.getUnique(Log).add("Hello " + coloredName(target));
  return true; // We handled it
}

export const world = new World()
  .registerComponent(Hero)
  .registerComponent(Tile)
  .registerComponent(Sprite)
  .registerComponent(Move)
  .registerComponent(Blop)
  .registerComponent(DNA)
  .registerComponent(FX)
  .registerComponent(Name)
  .registerComponent(Trigger)
  .registerComponent(Effect)
  .registerComponent(Pickup)
  .registerQueue(GameEvent)
  .addSystemSet(
    new SystemSet("game", ["start", "move", "act", "events", "finish"])
  )
  .addSystem("game", "move", new MoveSystem())
  .addSystem("game", "post-move", new PickupSystem())
  .addSystem("game", "post-move", new FovSystem().runIf(heroMoved)) // So that FOV is accurate for act, events
  .addSystem("game", "events", new EventSystem())
  .addSystem("game", "post-events", new FovSystem().runIf(heroTeleported)) // So that teleport updates before net loop
  .addSystem("game", "finish", new MaintainWorld()) // TODO - addMaintainWorld('game', 'finish') -or- addCommit('game', 'world')
  .addSystem(new TimerSystem())
  .addSystem(new RunSystemSet("game").runIf(gameReady)) // TODO - addRunSystemSet('game', gameReady)
  .setUnique(new Log(Constants.LOG_HEIGHT, Constants.LOG_WIDTH))
  .setUnique(new Game())
  .setUnique(new Timers())
  .setUnique(
    new FOV(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT),
    notifyFovWhenTilesChange
  )
  .setUnique(new CollisionManager(), (col) => {
    col
      .register(["hero"], ["blop"], sayHello)
      // .register(["blop"], ["hero"], attack)
      .register("actor", "wall", blockedMove)
      .register("hero", "stairs", (a, t, w) => gotoNextLevel(w));
  })
  .start();

declare global {
  var WORLD: World;
}

// @ts-ignore - TODO - Why do we have to ignore this?
globalThis.WORLD = world;
