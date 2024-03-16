import { Sprite, type SpriteConfig } from "./sprite";
import { Collider } from "gw-ecs/utils/collisions";

export interface TileConfig extends SpriteConfig {
  name: string;
  blocksVision?: boolean;
  blocksMove?: boolean;
  slide?: boolean;
  shock?: boolean;
  hurt?: number;
  stairs?: boolean;
}

export class Tile {
  name: string;
  blocksVision: boolean;
  blocksMove: boolean;
  slide: boolean;
  shock: boolean;
  hurt: number;
  stairs: boolean;
  sprite: Sprite;
  collider: Collider | null;

  constructor(name: string, opts: Omit<TileConfig, "name"> = { ch: "!" }) {
    this.name = name;
    this.blocksVision = opts.blocksVision || false;
    this.blocksMove = opts.blocksMove || false;
    this.slide = opts.slide || false;
    this.shock = opts.shock || false;
    this.hurt = opts.hurt || 0;
    this.stairs = opts.stairs || false;
    this.sprite = new Sprite(opts.ch, opts.fg, opts.bg);
    this.collider = this.blocksMove ? new Collider("wall") : null;
  }
}

export const FLOOR = new Tile("Ground", { ch: ".", fg: "grey" });
export const GRASS = new Tile("Grass", { ch: ",", fg: "green" });
export const WALL = new Tile("Wall", {
  blocksVision: true,
  blocksMove: true,
  ch: "#",
  fg: "grey",
});
export const FOG = new Tile("Fog", {
  blocksVision: true,
  ch: "~",
  fg: "white",
});
export const WATER = new Tile("Water", { shock: true, ch: "~", fg: "blue" });
export const EMBER = new Tile("Embers", { hurt: 1, ch: "!", fg: "crimson" });
export const ICE = new Tile("Ice", { slide: true, ch: "-", fg: "white" });
export const STAIRS = new Tile("Stairs", {
  stairs: true,
  ch: ">",
  fg: "white",
});
