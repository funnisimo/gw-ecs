import type { Entity } from "gw-ecs/entity";
import type { World, WorldInit } from "gw-ecs/world";
import { distanceFromTo, equals, type XY } from "gw-utils/xy";
import { Tile } from "../comps";
import { Pos } from "gw-ecs/common";
import { FOV } from "./fov";

export class FocusHelper implements WorldInit {
  entities: Entity[];
  entityIndex = 0;
  pos: XY | null;

  constructor() {
    this.entities = [];
    this.entityIndex = -1;
    this.pos = null;
  }

  worldInit(world: World): void {
    const entities = world.entities();
    entities.notify({
      entityDestroyed: (entity) => {
        this.entities = this.entities.filter((e) => e !== entity);
      },
    });
  }

  reset(world: World, pos: XY) {
    this.entities = [];
    this.pos = null; // { x: pos.x, y: pos.y };
    world.level.entities().forEach((e) => {
      if (e.has(Tile)) return;
      const pos = e.fetch(Pos);
      if (!pos) return;
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

  next(world: World): Entity | undefined {
    if (this.entities.length == 0) {
      this.pos = null;
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
        this.pos = pos.xy();
        return e;
      }
      tries += 1;
    } while (tries <= this.entities.length);
  }

  prev(world: World): Entity | undefined {
    if (this.entities.length == 0) {
      this.pos = null;
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
        this.pos = pos.xy();
        return e;
      }
      tries += 1;
    } while (tries <= this.entities.length);
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
