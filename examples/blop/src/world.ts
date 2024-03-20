import { World } from "gw-ecs/world";
import { Blop, BumpSprite, FX, Hero, Move, Sprite, Tile } from "./comps";
import { nextLevel } from "./map/nextLevel";
import { addLog } from "./ui/log";
import { CollisionManager } from "gw-ecs/common/collisions";
import { MoveSystem } from "./systems";
import { Game } from "./uniques";
import { GameEvent } from "./queues";
import { EventSystem } from "./systems/events";
import { DNA } from "./comps/dna";
import { Timers } from "gw-utils/app";
import { TimerSystem } from "./systems/timers";
import { flash } from "./fx/flash";
import type { Entity } from "gw-ecs/entity";
import { Pos } from "gw-ecs/common/positions";

function blockedMove(actor: Entity, target: Entity, world: World) {
  addLog("#{red}Blocked#{}");
  flash(world, target.fetch(Pos)!, BumpSprite, 150);
  // Does not count as turn for actor (esp hero)
  return true; // We handled the collision
}

function gotoNextLevel() {
  nextLevel(world);
  return true; // We handled the collision
}

export const world = new World()
  .registerComponent(Hero)
  .registerComponent(Tile)
  .registerComponent(Sprite)
  .registerComponent(Move)
  .registerComponent(Blop)
  .registerComponent(DNA)
  .registerComponent(FX)
  .registerQueue(GameEvent)
  .addSystem(new TimerSystem())
  .addSystem(new MoveSystem())
  .addSystem(new EventSystem())
  .setUnique(new Game())
  .setUnique(new CollisionManager(), (col) => {
    col
      // .register(["hero"], ["blop"], attack)
      // .register(["blop"], ["hero"], attack)
      .register("actor", "wall", blockedMove)
      .register("hero", "stairs", gotoNextLevel);
  })
  .setUnique(new Timers())
  .start();
