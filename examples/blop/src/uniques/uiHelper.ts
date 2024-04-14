import type { Entity } from "gw-ecs/entity";
import type { World, WorldInit } from "gw-ecs/world";
import { distanceFromTo, equals, type Loc, type XY } from "gw-utils/xy";
import { BLOP_ASPECT, EntityFlags, EntityInfo, Tile } from "../comps";
import { Pos } from "gw-ecs/common";
import { FOV } from "./fov";
import { Game } from "./game";

export class UiHelper implements WorldInit {
  entities: Entity[];
  entityIndex = 0;
  _pos: XY | null;
  path: Loc[] = [];

  constructor() {
    this.entities = [];
    this.entityIndex = -1;
    this._pos = null;
  }

  worldInit(world: World): void {
    const entities = world.entities();
    entities.notify({
      entityDestroyed: (entity) => {
        this.entities = this.entities.filter((e) => e !== entity);
      },
      // Can't do entityCreated because entity won't have position
    });

    // TODO - queue a trigger/queue to reset entities?

    // TODO - Watch EntityInfo
    // set
    // - If has pos, add to list?  FOV?
    // remove
    // - Remove from list?

    // TODO - Watch Pos
    // set
    // - if observable, add to list?  FOV?
    // remove
    // - remove from list?
  }

  get pos(): XY | null {
    return this._pos;
  }

  reset(world: World, pos: XY) {
    this.entities = [];
    this._pos = null; // { x: pos.x, y: pos.y };
    this.path = [];
    world.level.entities().forEach((e) => {
      const info = e.fetch(EntityInfo);
      if (!info) return;
      if (!info.hasFlag(EntityFlags.OBSERVE)) return;
      if (!e.has(Pos)) return;
      this.entities.push(e);
    });
    // const game = world.getUnique(Game);
    // const pos = game.focus || game.hero!.fetch(Pos)!;
    this.entities.sort(
      (a, b) =>
        distanceFromTo(a.fetch(Pos)!, pos) - distanceFromTo(b.fetch(Pos)!, pos)
    );
  }

  focusAt(pos: XY, path?: Loc[]) {
    this._pos = { x: pos.x, y: pos.y };
    this.path = path || [];
    // if (this.path.length > 0) {
    //   console.log(this.path.map((l) => `${l[0]},${l[1]}`));
    // }
    this.entities.sort(
      (a, b) =>
        distanceFromTo(a.fetch(Pos)!, pos) - distanceFromTo(b.fetch(Pos)!, pos)
    );
    if (this.entities.length > 0) {
      this.entityIndex = equals(this.entities[0].fetch(Pos)!, pos) ? 0 : -1; // So next will get to correct spot
    } else {
      this.entityIndex = -1;
    }
  }

  clearFocus() {
    this.entityIndex = -1;
    this._pos = null;
    this.path = [];
  }

  next(world: World): Entity | undefined {
    if (this.entities.length == 0) {
      this._pos = null;
      return undefined;
    }
    let tries = 0;
    const fov = world.getUnique(FOV);
    do {
      this.entityIndex += 1;
      if (this.entityIndex >= this.entities.length) {
        this.entityIndex = 0;
      }
      const e = this.entities[this.entityIndex]!;
      const pos = e.fetch(Pos)!;
      if (fov.isRevealed(pos.x, pos.y)) {
        // blops have to be visible to be seen
        if (!BLOP_ASPECT.match(e) || fov.isVisible(pos.x, pos.y)) {
          if (!equals(pos, this._pos)) {
            // Need to move to different pos
            this._pos = pos.xy();
            return e;
          }
        }
      }
      tries += 1;
    } while (tries <= this.entities.length);
  }

  prev(world: World): Entity | undefined {
    if (this.entities.length == 0) {
      this._pos = null;
      return undefined;
    }
    let tries = 0;
    const fov = world.getUnique(FOV);
    do {
      this.entityIndex -= 1;
      if (this.entityIndex < 0) {
        this.entityIndex = this.entities.length - 1;
      }
      const e = this.entities[this.entityIndex]!;
      const pos = e.fetch(Pos)!;
      if (fov.isRevealed(pos.x, pos.y)) {
        // blops have to be visible to be seen
        if (!BLOP_ASPECT.match(e) || fov.isVisible(pos.x, pos.y)) {
          if (!equals(pos, this._pos)) {
            // Need to move to different pos
            this._pos = pos.xy();
            return e;
          }
        }
      }
      tries += 1;
    } while (tries <= this.entities.length);
  }

  current(): Entity | undefined {
    return this.entities[this.entityIndex];
  }

  setPath(path: Loc[]) {
    this.path = path;
  }

  // selectClosestTo(pos: XY) : Entity {
  //   let bestDist = 9999;
  //   this.entities.forEach((e, i) => {
  //     const dist = distanceFromTo(e.fetch(Pos)!, pos);
  //     if (dist < bestDist) {
  //       bestDist = dist;
  //       this.index = i;
  //     }
  //   });
  //   return this.current;
  // }
}
