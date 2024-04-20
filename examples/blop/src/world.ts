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
  EntityInfo,
  PickupItem,
  takeTurn,
  Action,
  TakeTurn,
} from "./comps";
import { nextLevel } from "./map/nextLevel";
import { CollisionManager } from "gw-ecs/common/collisions";
import {
  ActionSystem,
  FovSystem,
  GameOverSystem,
  MoveSystem,
  RescheduleSystem,
  calculateFov,
  heroMoved,
  heroTeleported,
  rescheduleEntity,
  updateVisibility,
} from "./systems";
import { FOV, UiHelper, Game } from "./uniques";
import { GameEvent } from "./queues";
import { DnaSystem } from "./systems/dna";
import { DNA } from "./comps/dna";
import { Timers } from "gw-utils/app";
import { TimerSystem } from "./systems/timers";
import { flash } from "./fx/flash";
import type { Entity } from "gw-ecs/entity";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { MaintainWorld, Schedule } from "gw-ecs/common";
import { EntitySystemSet } from "gw-ecs/system";
import * as Constants from "./constants";
import { Log } from "./uniques/log";
import { coloredName } from "./comps";
import { GameTurnSystem } from "./systems/gameTurn";
import { DropSystem } from "./systems/drops";
import { Interrupt, MapChanged } from "./triggers";

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
  rescheduleEntity(world, hero); // counts as a step

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
  const actorBlop = actor.fetch(Blop);
  const targetBlop = target.fetch(Blop);
  if (!actorBlop || !targetBlop || actorBlop.team === targetBlop.team) {
    return false;
  }

  addAction(actor, new Attack(target));
  return true; // We handled it
}

function pushChargeSameTeam(actor: Entity, target: Entity, world: World) {
  // TODO - Should this be an action component?
  //      - addAction(actor, new ChargeBlop(target));
  const blop = actor.fetch(Blop)!;
  if (blop.charge < blop.maxCharge) {
    world
      .getUnique(Log)
      .add(`${coloredName(actor)} charges ${coloredName(target)}!`);
    blop.charge = Math.min(blop.charge + 1, blop.maxCharge);
  }
  addAction(actor, new Wait());
  return true;
}

function interruptEntity(world: World, interrupt: Interrupt) {
  console.log("-- interrupt --");
  const entity = interrupt.entity;
  entity.remove(TravelTo);
  entity.remove(Move);
  entity.remove(Wait);
  entity.remove(Attack); // ??
}

// Required b/c
function updateUiHelper(world: World) {
  const focus = world.getUnique(UiHelper);
  const game = world.getUnique(Game);
  if (!game.hero || game.over) return;

  focus.reset(world, game.hero.fetch(Pos)!);
}

function updateFov(world: World) {
  const game = world.getUnique(Game);
  if (!game.hero || game.over) return;

  updateVisibility(world);
  calculateFov(world, game.hero, true);
}

function collideDummy(actor: Entity, target: Entity, world: World) {
  if (swapPlaces(actor, target, world)) {
    return true;
  }
  return attackBlop(actor, target, world);
}

function swapPlaces(actor: Entity, target: Entity, world: World) {
  const actorBlop = actor.fetch(Blop);
  const targetBlop = target.fetch(Blop);
  if (!actorBlop || !targetBlop) return false;
  if (actorBlop.team == targetBlop.team) {
    // swap places
    const actorPos = actor.fetch(Pos)!;
    const targetPos = target.fetch(Pos)!;

    const posMgr = world.getUnique(PosManager);
    posMgr.set(actor, targetPos.x, targetPos.y);
    posMgr.set(target, actorPos.lastX, actorPos.lastY);
    addAction(actor, new TakeTurn());
    addAction(target, new TakeTurn()); // Force a turn so that we don't just re-swap
    console.log("- swap places", actor.index, target.index);
    return true;
  }
  return false;
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
  .registerComponents(Pickup)
  .registerComponent(Actor)
  .registerComponent(Move)
  .registerComponent(TravelTo)
  .registerComponent(EntityInfo)
  .registerComponent(Action)
  .registerQueue(GameEvent)
  .registerTrigger(Interrupt)
  .registerTrigger(MapChanged)
  .setUnique(new Log(Constants.SCREEN_HEIGHT, Constants.SCREEN_WIDTH))
  .setUnique(new Game())
  .setUnique(new Timers())
  .setUnique(new Schedule())
  .setUnique(new FOV(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT)) // , notifyFovWhenTilesChange
  .setUnique(
    new CollisionManager()
      // Hero swap with ally (incl dummy)
      .register("hero", "ally", swapPlaces)
      // .register("ally", "hero", swapPlaces)  // Do not let blops move the hero
      .register("hero", "blop", attackBlop)
      .register("ally", "blop", attackBlop)

      .register("blop", "hero", attackBlop)
      .register("blop", "ally", attackBlop)
      // Blop swap with dummy ally
      .register("blop", "dummy", swapPlaces)
      .register("blop", "blop", pushChargeSameTeam)

      .register("actor", "wall", blockedMove)
  )
  .addSystemSet(
    new EntitySystemSet("game", ["start", "move", "act", "events", "finish"])
      .addSystem("move", new MoveSystem())
      // TODO - Trigger
      .addSystem("post-move", new FovSystem().runIf(heroMoved)) // So that FOV is accurate for act, events
      .addSystem("act", new ActionSystem())
      .addSystem("events", new DnaSystem())
      .addSystem("events", new GameOverSystem())
      .addSystem("events", new DropSystem())
      // TODO - Trigger
      .addSystem("post-events", new FovSystem().runIf(heroTeleported)) // So that teleport updates before next loop
      .addSystem("finish", new RescheduleSystem())
      .addSystem("finish", new MaintainWorld()) // TODO - addMaintainWorld('game', 'finish') -or- both of the following...
    // TODO - addCommitDelayed('game', 'finish')
    // TODO - addMaintainQueue(GameEvent, 'game', 'finish') -or- addMaintainQueues('game', 'finish')
  )
  .addSystem(new TimerSystem())
  .addSystem(new GameTurnSystem("game").runIf(gameReady))
  .addTrigger(Interrupt, interruptEntity)
  .addTrigger(MapChanged, updateUiHelper)
  .addTrigger(MapChanged, updateFov)
  .start();

declare global {
  var WORLD: World;
}

// @ts-ignore - TODO - Why do we have to ignore this?
globalThis.WORLD = world;
