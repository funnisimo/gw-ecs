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
  PERMANENT,
  PERMANENT_BUNDLE,
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
import { forBorder, forRect } from "gw-utils/xy";
import { setTileType } from "./utils";
import type { Bundle } from "gw-ecs/entity/bundle";
import { Random } from "gw-utils/rng";

const SMALL_PATCHES = [EMBER_BUNDLE, FOG_BUNDLE, ICE_BUNDLE];
const BIG_PATCHES = [GRASS_BUNDLE, WATER_BUNDLE];
var CELLS_IN_PATCHES = BIG_PATCHES.concat(SMALL_PATCHES);

export function randomPatchTileType() {
  return random.item(CELLS_IN_PATCHES);
}

export function makeRandomWorld(world: World) {
  const mgr = new PosManager(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT);
  mgr.fill(() => WALL_BUNDLE.create(world));
  forBorder(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT, (x, y) => {
    const e = mgr.firstAt(x, y)!;
    PERMANENT_BUNDLE.applyTo(e, world);
  });
  world.setUnique(mgr);

  dig(world);
  generatePatches(world);
  return world;
}

function dig(world: World) {
  const mgr = world.getUnique(PosManager);
  const rng = world.getUnique(Random) || random;

  const dest = grid.alloc(mgr.width, mgr.height, 0);
  const bounds = carve.blob(dest, {
    birthParameters: "ftttttttf",
    survivalParameters: "fffttttff",
    percentSeeded: 10,
    rounds: 30,
    largestOnly: false,
    rng,
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
  const rng = world.getUnique(Random) || random;

  var patchTypes: Bundle[] = rng
    .shuffle(CELLS_IN_PATCHES)
    .slice(0, random.range(1, 3));
  var numberOfPatches = rng.range(
    Constants.WORLD_PATCHES_MIN_NUMBER,
    Constants.WORLD_PATCHES_MAX_NUMBER
  );

  for (let i = 0; i < numberOfPatches; i++) {
    const tileType = rng.item(patchTypes);
    const isSmall = SMALL_PATCHES.includes(tileType);
    const min = isSmall
      ? Constants.WORLD_SMALL_PATCHES_MIN_SIZE
      : Constants.WORLD_BIG_PATCHES_MIN_SIZE;
    const max = isSmall
      ? Constants.WORLD_SMALL_PATCHES_MAX_SIZE
      : Constants.WORLD_BIG_PATCHES_MAX_SIZE;
    const width = rng.range(min, max);
    const height = rng.range(min, max);
    const x = rng.range(0, Constants.WORLD_WIDTH - width - 1);
    const y = rng.range(0, Constants.WORLD_HEIGHT - height - 1);

    forRect(x, y, width, height, (x, y) => {
      const tileEntity = mgr.getAt(x, y, TILE_ASPECT)[0]!;
      if (tileEntity.fetch(Tile) === FLOOR) {
        tileType.applyTo(tileEntity, world);
      }
    });
  }
}

//# sourceURL=webpack://7drl-2021-blob-genes/./src/state/world/makeRandomWorld.ts?
