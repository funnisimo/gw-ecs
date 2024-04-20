import { Entity, EntityWatcher, Index, Aspect } from "../entity/index.js";
import { World, WorldInit } from "../world/index.js";

export class Pos {
  _x: number;
  _y: number;
  _lastX: number;
  _lastY: number;
  _facing: [number, number];
  //   _mgr: PosManager;

  constructor(
    /* mgr: PosManager, */ x = 0,
    y = 0,
    lastX?: number,
    lastY?: number
  ) {
    this._x = x;
    this._y = y;
    this._lastX = lastX || 0;
    this._lastY = lastY || 0;
    this._facing = [0, 0];
    if (lastY !== undefined && lastX !== undefined) {
      this.setFacing(x - lastX, y - lastY);
    }
    // this._mgr = mgr;
  }

  _set(x: number, y: number) {
    this._lastX = this._x;
    this._lastY = this._y;
    this._x = x;
    this._y = y;
    this.setFacing(x - this._lastX, y - this._lastY);
  }

  get x(): number {
    return this._x;
  }
  get y(): number {
    return this._y;
  }

  get lastX(): number {
    return this._lastX;
  }
  get lastY(): number {
    return this._lastY;
  }

  xy(): { x: number; y: number } {
    return { x: this._x, y: this._y };
  }

  lastXY(): { x: number; y: number } {
    return { x: this._lastX, y: this._lastY };
  }

  facing(): [number, number] {
    return this._facing;
  }

  setFacing(xy: { x: number; y: number }): void;
  setFacing(dir: [number, number]): void;
  setFacing(x: number, y: number): void;
  setFacing(...args: any[]): void {
    if (args.length == 2) {
      this._facing = [Math.sign(args[0]), Math.sign(args[1])];
      return;
    }
    if (Array.isArray(args[0])) {
      this.setFacing(args[0][0], args[0][1]);
      return;
    }
    this.setFacing(args[0].x, args[0].y);
  }

  // copy(pos: { x: number; y: number }): void {
  //   this._x = pos.x;
  //   this._y = pos.y;
  // }

  // add(pos: { x: number; y: number }): void;
  // add(x: number, y: number): void;
  // add(x: number | { x: number; y: number }, y?: number): void {
  //   if (typeof x === "object") {
  //     return this.add(x.x, x.y);
  //   }
  //   this._x += x || 0;
  //   this._y += y || 0;
  // }

  // sub(pos: { x: number; y: number }): void;
  // sub(x: number, y: number): void;
  // sub(x: number | { x: number; y: number }, y?: number): void {
  //   if (typeof x === "object") {
  //     return this.sub(x.x, x.y);
  //   }
  //   this._x -= x || 0;
  //   this._y -= y || 0;
  // }

  plus(loc: [number, number]): Pos;
  plus(pos: { x: number; y: number }): Pos;
  plus(x: number, y: number): Pos;
  plus(
    x: number | { x: number; y: number } | [number, number],
    y?: number
  ): Pos {
    if (Array.isArray(x)) {
      return this.plus(x[0], x[1]);
    }
    if (typeof x === "object") {
      return this.plus(x.x, x.y);
    }
    return new Pos((x || 0) + this._x, (y || 0) + this._y, this._x, this._y);
  }

  minus(loc: [number, number]): Pos;
  minus(pos: { x: number; y: number }): Pos;
  minus(x: number, y: number): Pos;
  minus(
    x: number | { x: number; y: number } | [number, number],
    y?: number
  ): Pos {
    if (Array.isArray(x)) {
      return this.minus(x[0], x[1]);
    }
    if (typeof x === "object") {
      return this.minus(x.x, x.y);
    }
    return new Pos(this._x - (x || 0), this._y - (y || 0), this._x, this._y);
  }

  equals(loc: [number, number]): boolean;
  equals(pos: { x: number; y: number }): boolean;
  equals(x: number, y: number): boolean;
  equals(
    x: number | { x: number; y: number } | [number, number],
    y?: number
  ): boolean {
    if (Array.isArray(x)) {
      return this.equals(x[0], x[1]);
    }
    if (typeof x === "object") {
      return this.equals(x.x, x.y);
    }
    return this._x == (x || 0) && this._y == (y || 0);
  }

  clone(): Pos {
    return new Pos(this._x, this._y, this._lastX, this._lastY);
  }
}

// TODO - Make this a CompStore<Pos>?
//      - may need update to be function based - entity.update(Pos, (p) => {})
export class PosManager implements EntityWatcher, WorldInit {
  _size: [number, number];
  _entitiesAt: Map<Index, Entity[]>;
  _tickSource: () => number;

  constructor(width: number, height: number) {
    this._size = [width, height];
    this._entitiesAt = new Map();
    this._tickSource = () => 0;
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

  // TODO - hasXY(xy: {x: number, y: number}): boolean;
  hasXY(x: number, y: number): boolean {
    return x >= 0 && x < this._size[0] && y >= 0 && y < this._size[1];
  }

  worldInit(world: World): void {
    // TODO - Make this a temp object instead of implementing the interface
    world.entities().notify(this); // Register interest in destroy events
    this._tickSource = () => world._currentTick;
  }

  _getIndex(x: number, y: number): number {
    return x + y * this.width;
  }

  // TODO - createFn: (xy) => Entity
  fill(createFn: (x: number, y: number) => Entity) {
    for (let x = 0; x < this.width; ++x) {
      for (let y = 0; y < this.height; ++y) {
        const entity = createFn(x, y);
        this.set(entity, x, y);
      }
    }
  }

  // TODO - hasAt(xy, aspect?)
  hasAt(x: number, y: number, aspect?: Aspect, sinceTick = 0): boolean {
    const index = this._getIndex(x, y);
    const entities = this._entitiesAt.get(index);
    if (!entities) return false;
    return aspect
      ? entities.some((e) => aspect.match(e, sinceTick))
      : entities.length > 0;
  }

  // TODO - getAt(xy, aspect?, sinceTick=0)
  getAt(x: number, y: number, aspect?: Aspect, sinceTick = 0): Entity[] {
    const index = this._getIndex(x, y);
    const entities = this._entitiesAt.get(index);
    if (!entities) return [];
    return aspect
      ? entities.filter((e) => aspect.match(e, sinceTick))
      : entities;
  }

  // TODO - firstAt(xy, aspect?, sinceTick)
  firstAt(
    x: number,
    y: number,
    aspect?: Aspect,
    sinceTick = 0
  ): Entity | undefined {
    return this.getAt(x, y, aspect, sinceTick)[0];
  }

  getFor(entity: Entity): Pos | undefined {
    return entity.fetch(Pos);
  }

  // TODO - set(entity, xy)
  set(entity: Entity, x: number, y: number) {
    const pos = entity.update(Pos);
    if (pos) {
      const oldIndex = this._getIndex(pos.x, pos.y);
      const oldEntities = this._entitiesAt.get(oldIndex);
      if (oldEntities) {
        const entityIndex = oldEntities.indexOf(entity);
        if (entityIndex >= 0) {
          oldEntities.splice(entityIndex, 1);
        }
      }
      pos._set(x, y);
    } else {
      entity._setComp(Pos, new Pos(/* this, */ x, y), this._tickSource());
    }
    const index = this._getIndex(x, y);
    let entities = this._entitiesAt.get(index);
    if (!entities) {
      entities = [];
      this._entitiesAt.set(index, entities);
    }
    entities.push(entity);
  }

  remove(entity: Entity) {
    const pos = entity.fetch(Pos);
    if (!pos) return;
    const index = this._getIndex(pos.x, pos.y);
    let entities = this._entitiesAt.get(index);
    if (!entities) return;
    const entityIndex = entities.indexOf(entity);
    if (entityIndex >= 0) {
      entities.splice(entityIndex, 1);
    }
    entity._removeComp(Pos, this._tickSource());
  }

  // TODO - cb: (xy, entities) => any
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

  // TODO - cb: (xy, entities) => any
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

  entityDestroyed(entity: Entity): void {
    this.remove(entity);
  }

  toJSON(): string {
    return JSON.stringify({
      size: this._size,
      entities: [...this._entitiesAt.entries()].map(([index, entities]) => {
        const x = index % this._size[0];
        const y = Math.floor(index / this._size[0]);
        return [x, y, entities.map((e) => e.index)];
      }),
    });
  }
}
