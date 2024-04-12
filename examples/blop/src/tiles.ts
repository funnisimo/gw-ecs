import { Aspect, Bundle, Entity } from "gw-ecs/entity";
import {
  Tile,
  Sprite,
  type SpriteConfig,
  type TileConfig,
  EntityInfo,
} from "./comps";
import { Collider } from "gw-ecs/common";
import type { World } from "gw-ecs/world";

export interface TileBundleConfig
  extends Omit<TileConfig, "name">,
    SpriteConfig {}

export function tileBundle(
  tile: Tile,
  opts: TileBundleConfig = { ch: "!" }
): Bundle {
  const bundle = new Bundle();
  bundle.with(tile).with(new Sprite(opts.ch, opts.fg, opts.bg));

  if (tile.stairs) {
    bundle.with(new EntityInfo(tile.name, "INTERRUPT_WHEN_SEEN, OBSERVE"));
  } else {
    bundle.with(new EntityInfo(tile.name));
  }

  if (tile.blocksMove) {
    bundle.with(new Collider("wall"));
  } else if (tile.stairs) {
    bundle.with(new Collider("stairs"));
  } else {
    bundle.with((w: World, e: Entity) => {
      e.remove(Collider);
    });
  }

  return bundle;
}

// TODO - move name to just bundle
export const FLOOR = new Tile("Ground");
export const FLOOR_BUNDLE = tileBundle(FLOOR, { ch: ".", fg: "grey" });

export const GRASS = new Tile("Grass");
export const GRASS_BUNDLE = tileBundle(GRASS, { ch: ",", fg: "green" });

export const RUBBLE = new Tile("Rubble");
export const RUBBLE_BUNDLE = tileBundle(RUBBLE, { ch: ";", fg: "grey" });

export const WALL = new Tile("Wall", {
  blocksVision: true,
  blocksMove: true,
});
export const WALL_BUNDLE = tileBundle(WALL, {
  ch: "#",
  fg: "grey",
});

export const PERMANENT = new Tile("Wall", {
  blocksVision: true,
  blocksMove: true,
  permanent: true,
});
export const PERMANENT_BUNDLE = tileBundle(PERMANENT, {
  ch: "#",
  fg: "dark_gray",
});

export const FOG = new Tile("Fog", {
  blocksVision: true,
});
export const FOG_BUNDLE = tileBundle(FOG, {
  ch: "~",
  fg: "white",
});

export const WATER = new Tile("Water", { shock: true });
export const WATER_BUNDLE = tileBundle(WATER, { ch: "~", fg: "blue" });

export const EMBER = new Tile("Embers", { hurt: 1 });
export const EMBER_BUNDLE = tileBundle(EMBER, { ch: "!", fg: "crimson" });

export const ICE = new Tile("Ice", { slide: true });
export const ICE_BUNDLE = tileBundle(ICE, { ch: "-", fg: "white" });

export const STAIRS = new Tile("Stairs", {
  stairs: true,
});
export const STAIRS_BUNDLE = tileBundle(STAIRS, {
  ch: ">",
  fg: "white",
});

export const STAIRS_ASPECT = new Aspect().and((e) => {
  const tile = e.fetch(Tile);
  return tile === STAIRS; // TODO - return !!tile && tile.stairs?
});

export const PATCH_TILES = [GRASS, FOG, WATER, EMBER, ICE];
export const PATCH_BUNDLES = [
  GRASS_BUNDLE,
  FOG_BUNDLE,
  WATER_BUNDLE,
  EMBER_BUNDLE,
  ICE_BUNDLE,
];
