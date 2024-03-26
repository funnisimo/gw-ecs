import { Entity } from "gw-ecs/entity";
import { World } from "gw-ecs/world";
import { createHero } from "../comps/hero";
import * as Constants from "../constants";
import { FOV, Log } from "../uniques";
import {
  findClosestEmptyFloor as findClosestSpawnTile,
  findSpawnTileFarFrom,
  setTileType,
} from "./utils";
import {
  COMPLEX_BLOP_BUNDLE,
  FAT_BLOP_BUNDLE,
  Hero,
  SMALL_BLOP_BUNDLE,
  STAIRS,
  STAIRS_BUNDLE,
  TILE_ASPECT,
  Tile,
  WARRIOR_BLOP_BUNDLE,
  createRandomEffect,
  createRandomTrigger,
} from "../comps";
import { makeRandomWorld } from "./randomWorld";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Game } from "../uniques";
import { random, type XY } from "gw-utils";

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

  // if (depth >= Constants.END_DEPTH) {
  //   makeBlopuletWorld(world);
  // } else {
  makeNormalLevel(world, game.depth);
  // }

  const posMgr = world.getUnique(PosManager);
  posMgr.everyXY((x, y, entities) => {
    const blocksVisibility = entities[0].fetch(Tile)!.blocksVision;
    fov.setBlocksVisibility(x, y, blocksVisibility);
  }, TILE_ASPECT);

  world.getUnique(Log).add("");
  world.getUnique(Log).add("=== LEVEL " + game.depth + " ===");

  //   return {
  //     depth: depth,
  //     world: newLevel.world,
  //     player: player,
  //     blops: newLevel.blops,
  //     pickables: newLevel.pickables,
  //     observationMode: null,
  //     placeGeneMode:
  //       (_state$placeGeneMode =
  //         state === null || state === void 0 ? void 0 : state.placeGeneMode) !==
  //         null && _state$placeGeneMode !== void 0
  //         ? _state$placeGeneMode
  //         : null,
  //     modalMode: null,
  //     finishedGame: false,
  //     finishedLevel: false,
  //   };
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

  var stairsXY = findSpawnTileFarFrom(
    world,
    heroXY,
    Constants.STAIRS_MIN_DISTANCE
  );
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
  // var items = makeItems(world, playerPos, depth);

  return {
    world: world,
    // playerPos: playerPos,
    // pickables: items,
    // blops: blops,
  };
}

function makeBlops(world: World, playerPos: XY, depth: number) {
  const mgr = world.getUnique(PosManager);
  var numberOfBlops =
    2 + Math.max(0, random.normal(depth / 2, Constants.BLOP_NUMBER_STDDEV));

  for (var i = 0; i < numberOfBlops; i++) {
    const blop = generateBlop(world, depth);
    const blopPos = findSpawnTileFarFrom(
      world,
      playerPos,
      Constants.MIN_BLOP_DISTANCE_AT_START
    );
    mgr.set(blop, blopPos.x, blopPos.y);
  }
}

// function makeItems(world, playerPos, depth) {
//   var otherForbiddenPos = [playerPos];
//   var items = [];

//   if (
//     rot_js__WEBPACK_IMPORTED_MODULE_0__.RNG.getPercentage() <
//     Constants.ADD_CHROMOSOME_ITEM_PROBABILITY
//   ) {
//     items.push({
//       position: (0, _State__WEBPACK_IMPORTED_MODULE_7__.findEmptyTileForSpawn)(
//         {
//           world: world,
//           pickables: items,
//         },
//         otherForbiddenPos
//       ),
//       object:
//         new _pickables_items_Item__WEBPACK_IMPORTED_MODULE_6__.AddChromosomeItem(),
//       noticedByPlayer: false,
//     });
//   }

//   if (
//     rot_js__WEBPACK_IMPORTED_MODULE_0__.RNG.getPercentage() <
//     Constants.EXPAND_LIFE_ITEM_PROBABILITY
//   ) {
//     items.push({
//       position: (0, _State__WEBPACK_IMPORTED_MODULE_7__.findEmptyTileForSpawn)(
//         {
//           world: world,
//           pickables: items,
//         },
//         otherForbiddenPos
//       ),
//       object:
//         new _pickables_items_Item__WEBPACK_IMPORTED_MODULE_6__.ExpandLifeItem(),
//       noticedByPlayer: false,
//     });
//   }

//   if (
//     rot_js__WEBPACK_IMPORTED_MODULE_0__.RNG.getPercentage() <
//     Constants.REINFORCE_ITEM_PROBABILITY
//   ) {
//     items.push({
//       position: (0, _State__WEBPACK_IMPORTED_MODULE_7__.findEmptyTileForSpawn)(
//         {
//           world: world,
//           pickables: items,
//         },
//         otherForbiddenPos
//       ),
//       object:
//         new _pickables_items_Item__WEBPACK_IMPORTED_MODULE_6__.ReinforceItem(),
//       noticedByPlayer: false,
//     });
//   }

//   if (depth % 4 === 0) {
//     items.push({
//       position: (0, _State__WEBPACK_IMPORTED_MODULE_7__.findEmptyTileForSpawn)(
//         {
//           world: world,
//           pickables: items,
//         },
//         otherForbiddenPos
//       ),
//       object:
//         new _pickables_items_Item__WEBPACK_IMPORTED_MODULE_6__.AddChromosomeItem(),
//       noticedByPlayer: false,
//     });
//   }

//   return items;
// }

//# sourceURL=webpack://7drl-2021-blob-genes/./src/state/world/nextLevel.ts?

const spawnProbabilities: { [key: string]: any } = {
  smallBlop: {
    bundle: SMALL_BLOP_BUNDLE,
    average: 1,
    deviation: 5,
    weight: 5,
  },
  fatBlop: {
    bundle: FAT_BLOP_BUNDLE,
    average: 6,
    deviation: 2,
    weight: 3,
  },
  warriorBlop: {
    bundle: WARRIOR_BLOP_BUNDLE,
    average: 8,
    deviation: 2,
    weight: 3,
  },
  complexBlop: {
    bundle: COMPLEX_BLOP_BUNDLE,
    average: 10,
    deviation: 1,
    weight: 3,
  },
};

const SQRT_2_PI = Math.sqrt(2 * Math.PI);
// https://www.math.net/gaussian-distribution
function gaussian(mu: number, stddev: number, x: number) {
  return (
    (1 / (stddev * SQRT_2_PI)) *
    Math.exp(-Math.pow(x - mu, 2) / (2 * stddev * stddev))
  );
}

function generateBlop(world: World, depth: number): Entity {
  const spawnProbabilityForLevel: Record<string, number> = {};

  for (let key in spawnProbabilities) {
    const spawnProbablity = spawnProbabilities[key];
    spawnProbabilityForLevel[key] =
      spawnProbablity.weight *
      gaussian(spawnProbablity.average, spawnProbablity.deviation, depth);
  }

  const selectedSpawnType = random.weighted(spawnProbabilityForLevel);
  const bundle = spawnProbabilities[selectedSpawnType].bundle;
  return bundle.create(world);
}
