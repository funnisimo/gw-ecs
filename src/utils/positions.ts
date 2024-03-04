import { Entity, Index } from "../entity/entity.js";
import { Aspect, World, WorldEventHandler } from "../world/index.js";

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

  get size(): [number, number] {
    return this._size;
  }

  hasXY(x: number, y: number): boolean {
    return x >= 0 && x < this._size[0] && y >= 0 && y < this._size[1];
  }

  init(world: World): PosManager {
    world.set(this); // Add as a resource (just in case)
    world.notify.push(this); // Register interest in destroy events
    return this;
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

  destroyEntity(entity: Entity): void {
    this.remove(entity);
  }
}
