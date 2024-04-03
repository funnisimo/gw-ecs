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
  Pickup,
  Sprite,
  Tile,
  Trigger,
  Wait,
  TravelTo,
  addAction,
  noTurn,
  takeTurn,
  EntityInfo,
  Interrupt,
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
import { FOV, Game } from "./uniques";
import { GameEvent } from "./queues";
import { DnaSystem } from "./systems/dna";
import { DNA } from "./comps/dna";
import { Timers } from "gw-utils/app";
import { TimerSystem } from "./systems/timers";
import { flash } from "./fx/flash";
import type { Entity } from "gw-ecs/entity";
import { Pos } from "gw-ecs/common/positions";
import { MaintainWorld, Schedule } from "gw-ecs/common";
import { EntitySystemSet } from "gw-ecs/system";
import * as Constants from "./constants";
import { Log } from "./uniques/log";
import { coloredName } from "./utils";
import { AttackSystem } from "./systems/attack";
import { GameTurnSystem } from "./systems/gameTurn";
import { Random } from "gw-utils/rng";

function blockedMove(actor: Entity, target: Entity, world: World) {
  if (actor.has(Hero)) {
    world.getUnique(Log).add("#{red}Blocked#{}");
    flash(world, target.fetch(Pos)!, BumpSprite, 150);
    noTurn(world, actor);
  } else {
    console.log("- blop blocked");
    addAction(actor, new Wait()); // Turns random move into a wait
  }
  return true; // We handled the collision
}

export function gotoNextLevel(world: World, hero: Entity) {
  // [X] Avoid stairs unless it is our goal
  if (hero.has(TravelTo)) {
    return false;
  }

  // hero moves to stairs loc
  // TODO - set hero pos to stairs pos
  takeTurn(world, hero); // counts as a step

  // TODO - prompt - do you want to take the stairs?
  //      - allows you to pass stairs in hall with arrow moves
  //      - default - 'yes'

  // Heal hero - on Trigger - NextLevel
  const blop = hero.fetch(Blop)!;
  blop.health = blop.maxHealth;

  // TODO - Trigger - NextLevel(depth + 1)
  nextLevel(world);

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
  // TODO - If same team - return false;
  addAction(actor, new Attack(target));
  return true; // We handled it
}

function pushChargeSameTeam(actor: Entity, target: Entity, world: World) {
  // TODO - Should this be an action component?
  //      - addAction(actor, new ChargeBlop(target));
  const blop = actor.fetch(Blop)!;
  world
    .getUnique(Log)
    .add(`${coloredName(actor)} charges ${coloredName(target)}!`);
  blop.charge += 1;
  addAction(actor, new Wait());
  return true;
}

function interruptEntity(world: World, interrupt: Interrupt) {
  console.log("-- interrupt --");
  const entity = interrupt.entity;
  entity.remove(TravelTo);
}

export const world = new World()
  .registerComponent(FX)
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
  .registerComponent(TravelTo)
  .registerComponent(EntityInfo)
  .registerQueue(GameEvent)
  .registerTrigger(Interrupt)
  .setUnique(new Log(Constants.LOG_HEIGHT, Constants.LOG_WIDTH))
  .setUnique(new Game())
  .setUnique(new Timers())
  .setUnique(new Schedule())
  .setUnique(new FOV(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT)) // , notifyFovWhenTilesChange
  .setUnique(new Random()) // for testing add a seed
  .setUnique(
    new CollisionManager()
      // Hero swap with ally (incl dummy)
      // .register('hero', 'blop', swapPlacesSameTeam)
      .register("hero", "blop", attackBlop)

      .register("blop", "hero", attackBlop)
      // Blop swap with dummy ally
      // .register('blop', 'dummy', swapPlacesSameTeam)
      .register("blop", "blop", pushChargeSameTeam) // TODO - What about swaps? or summoned allies?
      // .register('blop', 'blop', attackBlop)  // if not same team

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
    // TODO - addCommitDelayed('game', 'finish')
    // TODO - addMaintainQueue(GameEvent, 'game', 'finish') -or- addMaintainQueues('game', 'finish')
  )
  .addSystem(new TimerSystem())
  .addSystem(new GameTurnSystem("game").runIf(gameReady)) // TODO - addRunSystemSet('game', gameReady)
  .addTrigger(Interrupt, interruptEntity)
  .start();

declare global {
  var WORLD: World;
}

// @ts-ignore - TODO - Why do we have to ignore this?
globalThis.WORLD = world;
