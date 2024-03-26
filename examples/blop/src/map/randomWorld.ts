import { random, grid } from "gw-utils";
// import { Blob } from "gw-utils/blob";
import { carve } from "gw-dig";
import {
  EMBER,
  EMBER_BUNDLE,
  FLOOR,
  FLOOR_BUNDLE,
  FOG,
  FOG_BUNDLE,
  GRASS,
  GRASS_BUNDLE,
  ICE,
  ICE_BUNDLE,
  TILE_ASPECT,
  Tile,
  WALL,
  WALL_BUNDLE,
  WATER,
  WATER_BUNDLE,
} from "../comps/tile";
import type { World } from "gw-ecs/world";
import { PosManager } from "gw-ecs/common/positions";
import * as Constants from "../constants";
import { forRect } from "gw-utils/xy";
import { setTileType } from "./utils";
import type { Bundle } from "gw-ecs/entity/bundle";

const SMALL_PATCHES = [EMBER_BUNDLE, FOG_BUNDLE, ICE_BUNDLE];
const BIG_PATCHES = [GRASS_BUNDLE, WATER_BUNDLE];
var CELLS_IN_PATCHES = BIG_PATCHES.concat(SMALL_PATCHES);

export function randomPatchTileType() {
  return random.item(CELLS_IN_PATCHES);
}

export function makeRandomWorld(world: World) {
  const mgr = new PosManager(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT);
  mgr.fill(() => WALL_BUNDLE.create(world));
  world.setUnique(mgr);

  dig(world);
  generatePatches(world);
  return world;
}

function dig(world: World) {
  const mgr = world.getUnique(PosManager);
  const dest = grid.alloc(mgr.width, mgr.height, 0);
  const bounds = carve.blob(dest, {
    birthParameters: "ftttttttf",
    survivalParameters: "fffttttff",
    percentSeeded: 10,
    rounds: 30,
    largestOnly: false,
  });
  carve.connect(dest);
  dest.forEach((v: number, x: number, y: number) => {
    if (v) {
      setTileType(world, { x, y }, FLOOR_BUNDLE);
    }
  });
  grid.free(dest);
}

function generatePatches(world: World) {
  const mgr = world.getUnique(PosManager);
  var patchTypes: Bundle[] = random
    .shuffle(CELLS_IN_PATCHES)
    .slice(0, random.range(1, 3));
  var numberOfPatches = random.range(
    Constants.WORLD_PATCHES_MIN_NUMBER,
    Constants.WORLD_PATCHES_MAX_NUMBER
  );

  for (let i = 0; i < numberOfPatches; i++) {
    const tileType = random.item(patchTypes);
    const isSmall = SMALL_PATCHES.includes(tileType);
    const min = isSmall
      ? Constants.WORLD_SMALL_PATCHES_MIN_SIZE
      : Constants.WORLD_BIG_PATCHES_MIN_SIZE;
    const max = isSmall
      ? Constants.WORLD_SMALL_PATCHES_MAX_SIZE
      : Constants.WORLD_BIG_PATCHES_MAX_SIZE;
    const width = random.range(min, max);
    const height = random.range(min, max);
    const x = random.range(0, Constants.WORLD_WIDTH - width - 1);
    const y = random.range(0, Constants.WORLD_HEIGHT - height - 1);

    forRect(x, y, width, height, (x, y) => {
      const tileEntity = mgr.getAt(x, y, TILE_ASPECT)[0]!;
      if (tileEntity.fetch(Tile) === FLOOR) {
        tileType.applyTo(tileEntity, world);
      }
    });
  }
}

//# sourceURL=webpack://7drl-2021-blob-genes/./src/state/world/makeRandomWorld.ts?
