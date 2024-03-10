import "jest-extended";
import { Collider, CollisionManager } from "./collisions";
import { World } from "../world";

describe("collisions", () => {
  describe("Collider", () => {
    test("basics", () => {
      const c = new Collider("a");
      expect(c.tags).toEqual(["a"]);
      expect(c.match([])).toBeFalse();
      expect(c.match(["a"])).toBeTrue();
    });
  });

  describe("CollisionManager", () => {
    test("basic collision", () => {
      const collideFn = jest.fn();

      const world = new World();
      const manager = new CollisionManager();
      const init = jest.spyOn(manager, "worldInit");
      world.setUnique(manager);
      expect(init).toHaveBeenCalled();

      manager.register("a", "a", collideFn);

      const actor = world.create(new Collider("a"));
      const target = world.create(new Collider("a"));

      manager.collide(actor, target);
      expect(collideFn).toHaveBeenCalledWith(actor, target, world);
    });

    test("basic match collision", () => {
      const collideFn = jest.fn();

      const world = new World();
      const manager = new CollisionManager();
      world.setUnique(manager);

      manager.register("a", "b", collideFn);

      const actorA = world.create(new Collider("a"));
      const actorB = world.create(new Collider("b"));

      manager.collide(actorB, actorA);
      expect(collideFn).not.toHaveBeenCalled();

      manager.collide(actorA, actorB);
      expect(collideFn).toHaveBeenCalledWith(actorA, actorB, world);
    });
  });
});
