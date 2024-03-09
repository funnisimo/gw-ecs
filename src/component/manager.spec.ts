import "jest-extended";
import { World } from "../world";

class A {}
class B {}

describe("component manager", () => {
  it("should delete all components when an entity is removed", () => {
    let world = new World();
    world.registerComponents(A).registerComponents(B);

    let storeA = world.getStore(A);
    let storeB = world.getStore(B);

    let entity = world.create();

    storeA.set(entity, new A());
    storeB.set(entity, new B());

    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();

    world.queueDestroy(entity);
    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();
    expect(entity.isAlive()).toBeTrue();
    expect(storeA.fetch(entity)).toBeInstanceOf(A);
    expect(storeB.fetch(entity)).toBeInstanceOf(B);

    world.process();
    expect(entity.isAlive()).toBeFalse();
    expect(entity.has(A)).toBeFalse();
    expect(entity.has(B)).toBeFalse();

    expect(storeA.fetch(entity)).toBeUndefined();
    expect(storeB.fetch(entity)).toBeUndefined();
  });
});
