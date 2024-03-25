import type { Entity } from "gw-ecs/entity";
import type { World } from "gw-ecs/world";
import { distanceFromTo, equals, type XY } from "gw-utils/xy";
import { Tile } from "../comps";
import { Pos } from "gw-ecs/common";

export class FocusHelper {
  entities: Entity[];
  entityIndex = 0;
  pos: XY | null;

  constructor() {
    this.entities = [];
    this.entityIndex = -1;
    this.pos = null;
  }

  reset(world: World, pos: XY) {
    this.entities = [];
    this.pos = { x: pos.x, y: pos.y };
    world.level.entities().forEach((e) => {
      if (e.has(Tile)) return;
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

  focusAt(pos: XY) {
    this.pos = { x: pos.x, y: pos.y };
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
    this.pos = null;
  }

  next(): Entity | undefined {
    if (this.entities.length == 0) {
      this.pos = null;
      return undefined;
    }
    this.entityIndex += 1;
    if (this.entityIndex >= this.entities.length) {
      this.entityIndex = 0;
    }
    const e = this.entities[this.entityIndex]!;
    this.pos = e.fetch(Pos)!;
    return e;
  }

  prev(): Entity | undefined {
    if (this.entities.length == 0) {
      this.pos = null;
      return undefined;
    }
    this.entityIndex -= 1;
    if (this.entityIndex < 0) {
      this.entityIndex = this.entities.length - 1;
    }
    const e = this.entities[this.entityIndex]!;
    this.pos = e.fetch(Pos)!;
    return e;
  }

  current(): Entity | undefined {
    return this.entities[this.entityIndex];
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
