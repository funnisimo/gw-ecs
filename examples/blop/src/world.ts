import { World } from "gw-ecs/world";
import { Blop, Hero, Move, Sprite, Tile } from "./comps";
import { nextLevel } from "./map/nextLevel";
import { addLog } from "./ui/log";
import { CollisionManager } from "gw-ecs/utils/collisions";
import { MoveSystem } from "./systems";
import { Game } from "./uniques";
import { GameEvent } from "./queues";
import { EventSystem } from "./systems/events";
import { DNA } from "./comps/dna";

function blockedMove() {
  addLog("#{red}Blocked#{}");
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
  .registerQueue(GameEvent)
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
  .start();
