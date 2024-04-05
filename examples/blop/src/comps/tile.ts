import { World } from "gw-ecs/world";
import { Sprite, type SpriteConfig } from "./sprite";
import { Collider } from "gw-ecs/common/collisions";
import { Aspect, Bundle, Entity } from "gw-ecs/entity";
import { EntityInfo } from "./entityInfo";

export interface TileConfig {
  name: string;
  blocksVision?: boolean;
  blocksMove?: boolean;
  slide?: boolean;
  shock?: boolean;
  hurt?: number;
  stairs?: boolean;
  permanent?: boolean;
}

export class Tile {
  name: string;
  blocksVision: boolean;
  blocksMove: boolean;
  slide: boolean;
  shock: boolean;
  hurt: number;
  stairs: boolean;
  permanent: boolean;

  constructor(name: string, opts: Omit<TileConfig, "name"> = {}) {
    this.name = name;
    this.blocksVision = opts.blocksVision || false;
    this.blocksMove = opts.blocksMove || false;
    this.slide = opts.slide || false;
    this.shock = opts.shock || false;
    this.hurt = opts.hurt || 0;
    this.stairs = opts.stairs || false;
    this.permanent = opts.permanent || false;
  }
}

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

export const PATCH_TILES = [GRASS, FOG, WATER, EMBER, ICE];
export const PATCH_BUNDLES = [
  GRASS_BUNDLE,
  FOG_BUNDLE,
  WATER_BUNDLE,
  EMBER_BUNDLE,
  ICE_BUNDLE,
];

export const TILE_ASPECT = new Aspect(Tile);
