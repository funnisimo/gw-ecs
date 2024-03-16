import type { World } from "gw-ecs/world/world";
import * as XY from "gw-utils/xy";
import { FLOOR, Tile } from "../comps";
import { PosManager } from "gw-ecs/utils/positions";
import { Aspect } from "gw-ecs/world/aspect";
import { Random, random } from "gw-utils/rng";
import { Collider } from "gw-ecs/utils/collisions";

class RandomXY {
  _indexes: number[];
  _width: number;
  _current: number;

  constructor(width: number, height: number, rng?: Random) {
    this._indexes = Array.apply(null, Array(width * height)).map(function (
      x,
      i
    ) {
      return i;
    });
    this._width = width;
    this._current = 0;
    this.shuffle(rng);
  }

  shuffle(rng?: Random) {
    rng = rng || random;
    rng.shuffle(this._indexes);
  }

  next(): XY.XY {
    this._current = (this._current + 1) % this._indexes.length;
    const val = this._indexes[this._current];
    return { x: val % this._width, y: Math.floor(val / this._width) };
  }

  find(fn: (xy: XY.XY) => boolean): XY.XY | undefined {
    for (let offset = 0; offset < this._indexes.length; ++offset) {
      let xy = this.next();
      if (fn(xy)) {
        return xy;
      }
    }
  }
}

export function findClosestEmptyFloor(world: World, pos: XY.XY): XY.XY {
  const mgr = world.getUnique(PosManager);
  const locs = XY.closestMatchingLocs(pos.x, pos.y, (x, y) => {
    const entities = mgr.getAt(x, y);
    if (entities.length != 1) return false;
    const tileEntity = entities[0];
    return tileEntity.fetch(Tile) === FLOOR;
  });
  if (!locs || !locs.length) throw new Error("Failed to find open floor tile.");
  const rng = world.getUnique(Random) || random;
  const loc = rng.item(locs);
  return XY.asXY(loc);
}

export function findEmptyTileForSpawn(
  world: World,
  matchFn?: (xy: XY.XY) => boolean
): XY.XY {
  const mgr = world.getUnique(PosManager);

  const rng = world.getUnique(Random) || random;
  let locs = new RandomXY(mgr.width, mgr.height, rng);

  const loc = locs.find((xy) => {
    const entities = mgr.getAt(xy.x, xy.y);
    if (entities.length != 1) return false;
    const tileEntity = entities[0];
    if (tileEntity.fetch(Tile) !== FLOOR) return false;
    if (matchFn) return matchFn(xy);
    return true;
  });
  if (loc) return loc;
  throw new Error("Failed to: findEmptyTileForSpawn");
}

export function findSpawnTileFarFrom(world: World, farLoc: XY.XY, dist = 10) {
  // eslint-disable-next-line no-constant-condition
  const pos = findEmptyTileForSpawn(world, (xy) => {
    return XY.manhattanDistanceFromTo(xy, farLoc) >= dist;
  });

  return pos;
}

export function setTileType(world: World, xy: XY.XY, tile: Tile) {
  const mgr = world.getUnique(PosManager);
  const entity = mgr.firstAt(xy.x, xy.y, new Aspect(Tile));
  if (!entity)
    throw new Error("Failed to find tile at pos: " + xy.x + "," + xy.y);
  entity.setAll(tile, tile.sprite);
  if (tile.collider) {
    entity.set(tile.collider);
  } else {
    entity.remove(Collider);
  }
}
