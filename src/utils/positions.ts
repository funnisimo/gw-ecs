import { Entity, Index } from "../entity";

export class Pos {
  x: number;
  y: number;
  //   _mgr: PosManager;

  constructor(/* mgr: PosManager, */ x: number, y: number) {
    this.x = x;
    this.y = y;
    // this._mgr = mgr;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equals(x: number, y: number): boolean {
    return this.x == x && this.y == y;
  }
}

export class PosManager {
  _size: [number, number];
  _entities: Map<Index, Entity>;

  constructor(width: number, height: number) {
    this._size = [width, height];
    this._entities = new Map();
  }

  getAt(x: number, y: number): Entity[] {
    const out: Entity[] = [];
    for (let entity of this._entities.values()) {
      if (entity.fetch(Pos)!.equals(x, y)) {
        out.push(entity);
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

  delete(entity: Entity) {
    if (this._entities.delete(entity.index)) {
      entity._removeComp(Pos);
    }
  }
}
