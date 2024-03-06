import { Entity, Index } from "../entity/entity.js";
import { Aspect, World, WorldEventHandler } from "../world/index.js";

export class Pos {
  x: number;
  y: number;
  //   _mgr: PosManager;

  constructor(/* mgr: PosManager, */ x = 0, y = 0) {
    this.x = x;
    this.y = y;
    // this._mgr = mgr;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  copy(pos: { x: number; y: number }): void {
    this.x = pos.x;
    this.y = pos.y;
  }

  add(pos: { x: number; y: number }): void;
  add(x: number, y: number): void;
  add(x: number | { x: number; y: number }, y?: number): void {
    if (typeof x === "object") {
      return this.add(x.x, x.y);
    }
    this.x += x || 0;
    this.y += y || 0;
  }

  sub(pos: { x: number; y: number }): void;
  sub(x: number, y: number): void;
  sub(x: number | { x: number; y: number }, y?: number): void {
    if (typeof x === "object") {
      return this.sub(x.x, x.y);
    }
    this.x -= x || 0;
    this.y -= y || 0;
  }

  plus(pos: { x: number; y: number }): Pos;
  plus(x: number, y: number): Pos;
  plus(x: number | { x: number; y: number }, y?: number): Pos {
    if (typeof x === "object") {
      return this.plus(x.x, x.y);
    }
    return new Pos((x || 0) + this.x, (y || 0) + this.y);
  }

  minus(pos: { x: number; y: number }): Pos;
  minus(x: number, y: number): Pos;
  minus(x: number | { x: number; y: number }, y?: number): Pos {
    if (typeof x === "object") {
      return this.minus(x.x, x.y);
    }
    return new Pos(this.x - (x || 0), this.y - (y || 0));
  }

  equals(pos: { x: number; y: number }): boolean;
  equals(x: number, y: number): boolean;
  equals(x: number | { x: number; y: number }, y?: number): boolean {
    if (typeof x === "object") {
      return this.equals(x.x, x.y);
    }
    return this.x == (x || 0) && this.y == (y || 0);
  }
}

// Need World Hook for Destroy Entity
// ??? world.notify.push(this);
// interface WorldEvent { destroyEntity(entity: Entity): void; }

export class PosManager implements WorldEventHandler {
  _size: [number, number];
  _entities: Map<Index, Entity>;

  constructor(width: number, height: number) {
    this._size = [width, height];
    this._entities = new Map();
  }

  get width(): number {
    return this._size[0];
  }
  get height(): number {
    return this._size[1];
  }
  get size(): [number, number] {
    return this._size;
  }

  hasXY(x: number, y: number): boolean {
    return x >= 0 && x < this._size[0] && y >= 0 && y < this._size[1];
  }

  init(world: World): PosManager {
    world.setGlobal(this); // Add to world just in case
    world.notify.push(this); // Register interest in destroy events
    return this;
  }

  hasAt(x: number, y: number, aspect?: Aspect, sinceTick = 0): boolean {
    for (let entity of this._entities.values()) {
      if (entity.fetch(Pos)!.equals(x, y)) {
        if (!aspect || aspect.match(entity, sinceTick)) {
          return true;
        }
      }
    }
    return false;
  }

  getAt(x: number, y: number, aspect?: Aspect, sinceTick = 0): Entity[] {
    const out: Entity[] = [];
    for (let entity of this._entities.values()) {
      if (entity.fetch(Pos)!.equals(x, y)) {
        if (!aspect || aspect.match(entity, sinceTick)) {
          out.push(entity);
        }
      }
    }
    return out;
  }

  getFor(entity: Entity): Pos | undefined {
    return entity.fetch(Pos);
  }

  set(entity: Entity, x: number, y: number) {
    const pos = entity.update(Pos);
    if (pos) {
      pos.set(x, y);
    } else {
      entity._addComp(Pos, new Pos(/* this, */ x, y));
      this._entities.set(entity.index, entity);
    }
  }

  remove(entity: Entity) {
    if (this._entities.delete(entity.index)) {
      entity._removeComp(Pos);
    }
  }

  eachXY(
    cb: (x: number, y: number, entities: Entity[]) => any,
    aspect?: Aspect,
    sinceTick = 0
  ) {
    const [width, height] = this._size;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        const entities = this.getAt(x, y, aspect, sinceTick);
        if (entities.length) {
          cb(x, y, entities);
        }
      }
    }
  }

  everyXY(
    cb: (x: number, y: number, entities: Entity[]) => any,
    aspect?: Aspect,
    sinceTick = 0
  ) {
    const [width, height] = this._size;
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        const entities = this.getAt(x, y, aspect, sinceTick);
        cb(x, y, entities);
      }
    }
  }

  destroyEntity(entity: Entity): void {
    this.remove(entity);
  }
}
