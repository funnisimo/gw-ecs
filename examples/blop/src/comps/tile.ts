import { Aspect } from "gw-ecs/entity";

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

export const TILE_ASPECT = new Aspect(Tile);
