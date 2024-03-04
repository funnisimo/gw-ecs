import "jest-extended";
import { PosManager, Pos } from "./positions";
import { World } from "../world";

describe("Positions", () => {
  test("get, set positions", () => {
    const world = new World();

    const mgr = new PosManager(10, 10); // dims
    world.set(mgr); // You would normally store this in your world...

    const e1 = world.create();

    expect(e1.has(Pos)).toBeFalse();
    expect(mgr.getAt(0, 0)).toEqual([]);
    expect(mgr.getFor(e1)).toBeUndefined();

    mgr.set(e1, 1, 2);
    expect(mgr.getAt(1, 2)).toEqual([e1]);
    expect(e1.has(Pos)).toBeTrue();
    expect(e1.isAddedSince(Pos, 0)).toBeTrue();

    const pos = e1.update(Pos)!;
    expect(pos).toMatchObject({ x: 1, y: 2 });
    expect(mgr.getFor(e1)).toBe(pos);

    mgr.set(e1, 2, 3);
    expect(mgr.getAt(1, 2)).toEqual([]);
    expect(mgr.getAt(2, 3)).toEqual([e1]);

    pos.set(3, 4);
    expect(mgr.getAt(2, 3)).toEqual([]);
    expect(mgr.getAt(3, 4)).toEqual([e1]);

    mgr.remove(e1);
    expect(e1.has(Pos)).toBeFalse();
    expect(mgr.getAt(3, 4)).toEqual([]);
    expect(e1.isRemovedSince(Pos, 0)).toBeTrue();
  });
});
