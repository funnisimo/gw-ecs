import { World } from "gw-ecs/world";
import { createHero } from "../hero";
import * as Constants from "../constants";
import { FOV, FocusHelper, Log } from "../uniques";
import {
  findClosestEmptyFloor as findClosestSpawnTile,
  findEmptyFloorTileFarFrom,
  setTileType,
} from "./utils";
import {
  Hero,
  EntityInfo,
  STAIRS_BUNDLE,
  TILE_ASPECT,
  Tile,
  createRandomEffect,
  createRandomTrigger,
} from "../comps";
import { makeRandomWorld } from "./randomWorld";
import { Pos, PosManager } from "gw-ecs/common/positions";
import { Game } from "../uniques";
import { random, type XY } from "gw-utils";
import { gaussian } from "../utils";
import { SPAWN_TABLE } from "../blops";
import { calculateFov, updateVisibility } from "../systems";

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
  var numberOfBlops = Math.min(
    depth * 2,
    2 + Math.max(0, random.normal(depth / 2, Constants.BLOP_NUMBER_STDDEV))
  );

  console.log("GENERATING " + numberOfBlops + " BLOPS");

  const weights = SPAWN_TABLE.map((t) =>
    Math.round(1000 * t.weight * gaussian(t.average, t.deviation, depth))
  );

  console.log("spawn probabilities", weights);

  for (var i = 0; i < numberOfBlops; i++) {
    const index = random.weighted(weights);
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
