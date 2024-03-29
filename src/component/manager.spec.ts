import "jest-extended";
import { World } from "../world";

class A {}
class B {}
class C extends A {}

describe("component manager", () => {
  it("should delete all components when an entity is removed", () => {
    let world = new World();
    world.registerComponents(A).registerComponents(B);

    let storeA = world.getStore(A)!;
    let storeB = world.getStore(B)!;

    let entity = world.create();

    storeA.set(entity, new A());
    storeB.set(entity, new B());

    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();

    world.destroyLater(entity);
    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();
    expect(entity.isAlive()).toBeTrue();
    expect(storeA.fetch(entity)).toBeInstanceOf(A);
    expect(storeB.fetch(entity)).toBeInstanceOf(B);

    world.maintain();
    expect(entity.isAlive()).toBeFalse();
    expect(entity.has(A)).toBeFalse();
    expect(entity.has(B)).toBeFalse();

    expect(storeA.fetch(entity)).toBeUndefined();
    expect(storeB.fetch(entity)).toBeUndefined();
  });

  test("subclass", () => {
    let world = new World();
    world.registerComponents(A, B);

    const c = new C();
    const entity = world.create(c);
    expect(entity.fetch(A)).toBe(c);
  });

  test("subclass also registered", () => {
    let world = new World();
    world.registerComponents(A, B, C);

    const c = new C();
    const entity = world.create(c);
    expect(entity.fetch(A)).toBeUndefined();
    expect(entity.fetch(C)).toBe(c);
  });
});
