import "jest-extended";
import { CollisionManager } from "./collisions";
import { Aspect, World } from "../world";

class A {}
class B {}

describe("CollisionManager", () => {
  test("basic collision", () => {
    const collideFn = jest.fn();

    const world = new World();
    const manager = new CollisionManager();
    const init = jest.spyOn(manager, "worldInit");
    world.setGlobal(manager);
    expect(init).toHaveBeenCalled();

    manager.register(new Aspect(), new Aspect(), collideFn);

    const actor = world.create();
    const target = world.create();

    manager.collide(actor, target);
    expect(collideFn).toHaveBeenCalledWith(actor, target, world);
  });

  test("basic match collision", () => {
    const collideFn = jest.fn();

    const world = new World().registerComponents(A, B);
    const manager = new CollisionManager();
    world.setGlobal(manager);

    manager.register(new Aspect(A), new Aspect(B), collideFn);

    const actor = world.create(new A());
    const target = world.create();

    manager.collide(actor, target);
    expect(collideFn).not.toHaveBeenCalled();

    target.add(new B());
    manager.collide(actor, target);
    expect(collideFn).toHaveBeenCalledWith(actor, target, world);
  });
});
