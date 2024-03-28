import { World } from "gw-ecs/world";
import {
  Actor,
  Attack,
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
  Wait,
  addAction,
  noTurn,
  takeTurn,
} from "./comps";
import { nextLevel } from "./map/nextLevel";
import { CollisionManager } from "gw-ecs/common/collisions";
import {
  FovSystem,
  MoveSystem,
  PickupSystem,
  RescheduleSystem,
  WaitSystem,
  heroMoved,
  heroTeleported,
} from "./systems";
import { FOV, Game, notifyFovWhenTilesChange } from "./uniques";
import { GameEvent } from "./queues";
import { DnaSystem } from "./systems/dna";
import { DNA } from "./comps/dna";
import { Timers } from "gw-utils/app";
import { TimerSystem } from "./systems/timers";
import { flash } from "./fx/flash";
import type { Entity } from "gw-ecs/entity";
import { Pos } from "gw-ecs/common/positions";
import { MaintainWorld, RunSystemSet, Schedule } from "gw-ecs/common";
import { EntitySystemSet, QueueSystemStep, SystemSet } from "gw-ecs/system";
import { FocusHelper } from "./uniques";
import * as Constants from "./constants";
import { Log } from "./uniques/log";
import { coloredName } from "./utils";
import { AttackSystem } from "./systems/attack";
import { GameTurnSystem } from "./systems/gameTurn";

function blockedMove(actor: Entity, target: Entity, world: World) {
  world.getUnique(Log).add("#{red}Blocked#{}");
  flash(world, target.fetch(Pos)!, BumpSprite, 150);
  noTurn(world, actor);
  return true; // We handled the collision
}

export function gotoNextLevel(world: World, hero: Entity) {
  takeTurn(world, hero); // counts as a step

  nextLevel(world);
  const focus = world.getUnique(FocusHelper);
  const game = world.getUnique(Game);
  focus.reset(world, game.hero!.fetch(Pos)!);
  game.changed = true;
  return true; // We handled the collision
}

function gameReady(world: World) {
  const timersReady = world.getUnique(Timers)!.length == 0;
  return timersReady;
}

function sayHello(actor: Entity, target: Entity, world: World) {
  world.getUnique(Log).add("Hello " + coloredName(target));
  return true; // We handled it
}

function attackBlop(actor: Entity, target: Entity, world: World) {
  addAction(actor, new Attack(target));
  return true; // We handled it
}

export const world = new World()
  .registerComponent(FX)
  .registerComponent(Name)
  .registerComponent(Sprite)
  .registerComponent(Tile)
  .registerComponent(Hero)
  .registerComponent(Blop)
  .registerComponent(DNA)
  .registerComponent(Trigger)
  .registerComponent(Effect)
  .registerComponent(Pickup)
  .registerComponent(Actor)
  .registerComponent(Wait)
  .registerComponent(Move)
  .registerComponent(Attack)
  .registerQueue(GameEvent)
  .setUnique(new Log(Constants.LOG_HEIGHT, Constants.LOG_WIDTH))
  .setUnique(new Game())
  .setUnique(new Timers())
  .setUnique(new Schedule())
  .setUnique(new FOV(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT)) // , notifyFovWhenTilesChange
  .setUnique(
    new CollisionManager()
      .register("hero", "blop", attackBlop)
      .register("blop", "hero", attackBlop)
      .register("actor", "wall", blockedMove)
      .register("hero", "stairs", (a, t, w) => gotoNextLevel(w, a))
  )
  .addSystemSet(
    new EntitySystemSet("game", ["start", "move", "act", "events", "finish"])
      .addSystem("move", new MoveSystem())
      .addSystem("post-move", new PickupSystem())
      .addSystem("post-move", new FovSystem().runIf(heroMoved)) // So that FOV is accurate for act, events
      .addSystem("act", new AttackSystem())
      .addSystem("act", new WaitSystem())
      .addSystem("events", new DnaSystem())
      .addSystem("post-events", new FovSystem().runIf(heroTeleported)) // So that teleport updates before next loop
      .addSystem("finish", new RescheduleSystem())
      .addSystem("finish", new MaintainWorld()) // TODO - addMaintainWorld('game', 'finish') -or- both of the following...
    // TODO - addCommitDelayed('game', 'world')
    // TODO - addMaintainQueue(GameEvent, 'game', 'finish') -or- addMaintainQueues('game', 'finish')
  )
  .addSystem(new TimerSystem())
  .addSystem(new GameTurnSystem("game").runIf(gameReady)) // TODO - addRunSystemSet('game', gameReady)
  .start();

declare global {
  var WORLD: World;
}

// @ts-ignore - TODO - Why do we have to ignore this?
globalThis.WORLD = world;
