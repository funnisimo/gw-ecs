import { World } from "gw-ecs/world";
import { createHero } from "../hero";
import * as Constants from "../constants";
import { FOV, FocusHelper, Log } from "../uniques";
import {
  findClosestEmptyFloor as findClosestSpawnTile,
  findEmptyFloorTile,
  findEmptyFloorTileFarFrom,
  setTileType,
} from "./utils";
import { Hero, EntityInfo, STAIRS_BUNDLE } from "../comps";
import { makeRandomWorld } from "./randomWorld";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Game } from "../uniques";
import { random, type XY } from "gw-utils";
import { gaussian } from "../utils";
import { SPAWN_TABLE } from "../blops";
import { calculateFov, updateVisibility } from "../systems";
import { ADDSLOT_BUNDLE, EXPAND_HEALTH_BUNDLE, POWERUP_BUNDLE } from "../drops";
import { Random } from "gw-utils/rng";
import { createRandomTrigger } from "../triggers";
import { createRandomEffect } from "../effects";

export function nextLevel(world: World) {
  const game = world.getUnique(Game);

  // Clean the world
  world.destroyEntities((e) => !e.has(Hero));
  // - all entities other than Hero
  // - detachEntity(hero) + destroyAllEntities() + attachEntity(hero) ?

  game.depth += 1;
  // var newLevel;

  const fov = world.getUnique(FOV);
  fov.reset();

  world.getUnique(Log).add("");
  world.getUnique(Log).add("=== LEVEL " + game.depth + " ===");

  // if (depth >= Constants.END_DEPTH) {
  //   makeBlopuletWorld(world);
  // } else {
  makeNormalLevel(world, game.depth);
  // }

  updateVisibility(world);
  calculateFov(world, game.hero!, false);
  game.changed = true;

  const focus = world.getUnique(FocusHelper);
  focus.reset(world, game.hero!.fetch(Pos)!);
}

function makeNormalLevel(world: World, depth: number) {
  makeRandomWorld(world);

  const game = world.getUnique(Game);

  let hero = game.hero;
  let startingHeroXY = { x: 5, y: 5 };
  if (!hero) {
    hero = createHero(world);
    game.hero = hero;
  } else {
    const pos = hero.fetch(Pos)!;
    startingHeroXY = { x: pos.x, y: pos.y };
  }

  // console.log("hero xy - before", startingHeroXY);
  const heroXY = findClosestSpawnTile(world, startingHeroXY);
  const mgr = world.getUnique(PosManager);
  mgr.set(hero, heroXY.x, heroXY.y);
  // console.log("hero starting xy", heroXY);

  const stairsXY = findEmptyFloorTileFarFrom(
    world,
    heroXY,
    Constants.STAIRS_MIN_DISTANCE
  );
  if (!stairsXY) {
    throw new Error("Failed to find location for stairs.");
  }
  setTileType(world, stairsXY, STAIRS_BUNDLE);

  const triggerXY = findClosestSpawnTile(world, startingHeroXY);
  console.log("trigger @", triggerXY);
  const trigger = createRandomTrigger(world);
  mgr.set(trigger, triggerXY.x, triggerXY.y);

  const effectXY = findClosestSpawnTile(world, startingHeroXY);
  console.log("effect @", effectXY);
  const effect = createRandomEffect(world);
  mgr.set(effect, effectXY.x, effectXY.y);

  makeBlops(world, heroXY, depth);
  makeItems(world, heroXY, depth);
}

function makeBlops(world: World, playerPos: XY, depth: number) {
  const mgr = world.getUnique(PosManager);
  const rng = world.getUnique(Random) || random;

  var numberOfBlops = Math.min(
    depth * 2,
    2 + Math.max(0, rng.normal(depth / 2, Constants.BLOP_NUMBER_STDDEV))
  );

  console.log("GENERATING " + numberOfBlops + " BLOPS");

  const weights = SPAWN_TABLE.map((t) =>
    Math.round(1000 * t.weight * gaussian(t.average, t.deviation, depth))
  );

  console.log("spawn probabilities", weights);

  for (var i = 0; i < numberOfBlops; i++) {
    const index = rng.weighted(weights);
    const bundle = SPAWN_TABLE[index].bundle;
    const blop = bundle.create(world);

    const blopPos = findEmptyFloorTileFarFrom(
      world,
      playerPos,
      Constants.MIN_BLOP_DISTANCE_AT_START
    );
    if (!blopPos) {
      world.destroyNow(blop);
      console.warn("Failed to find place to spawn blop.");
    } else {
      mgr.set(blop, blopPos.x, blopPos.y);
      console.log(blop.fetch(EntityInfo)!.name, blopPos);
    }
  }
}

function makeItems(world: World, playerPos: XY, depth: number) {
  const rng = world.getUnique(Random) || random;
  const posMgr = world.getUnique(PosManager);

  if (rng.chance(Constants.ADD_CHROMOSOME_ITEM_PROBABILITY)) {
    const itemPos = findEmptyFloorTile(world);
    if (itemPos) {
      console.log("* add slot", itemPos);
      const entity = ADDSLOT_BUNDLE.create(world);
      posMgr.set(entity, itemPos.x, itemPos.y);
    }
  }

  if (rng.chance(Constants.EXPAND_LIFE_ITEM_PROBABILITY)) {
    const itemPos = findEmptyFloorTile(world);
    if (itemPos) {
      console.log("* heal", itemPos);
      const entity = EXPAND_HEALTH_BUNDLE.create(world);
      posMgr.set(entity, itemPos.x, itemPos.y);
    }
  }

  if (rng.chance(Constants.REINFORCE_ITEM_PROBABILITY)) {
    const itemPos = findEmptyFloorTile(world);
    if (itemPos) {
      console.log("* powerup", itemPos);
      const entity = POWERUP_BUNDLE.create(world);
      posMgr.set(entity, itemPos.x, itemPos.y);
    }
  }

  if (depth % 4 === 0) {
    const itemPos = findEmptyFloorTile(world);
    if (itemPos) {
      console.log("* add slot", itemPos);
      const entity = ADDSLOT_BUNDLE.create(world);
      posMgr.set(entity, itemPos.x, itemPos.y);
    }
  }
}

//# sourceURL=webpack://7drl-2021-blob-genes/./src/state/world/nextLevel.ts?
