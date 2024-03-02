import "jest-extended";
import { World } from "../core";

class A {}
class B {}

describe("component manager", () => {
  it("should delete all components when an entity is removed", () => {
    let world = new World();
    world.registerComponent(A).registerComponent(B);

    let managerComponentA = world.getComponentManager(A);
    let managerComponentB = world.getComponentManager(B);

    let entity = world.create();

    managerComponentA.add(entity, new A());
    managerComponentB.add(entity, new B());

    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();

    world.queueDestroy(entity);
    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();
    expect(entity.isAlive()).toBeTrue();
    expect(managerComponentA.fetch(entity)).toBeInstanceOf(A);
    expect(managerComponentB.fetch(entity)).toBeInstanceOf(B);

    world.process();
    expect(entity.isAlive()).toBeFalse();
    expect(entity.has(A)).toBeFalse();
    expect(entity.has(B)).toBeFalse();

    expect(managerComponentA.fetch(entity)).toBeUndefined();
    expect(managerComponentB.fetch(entity)).toBeUndefined();
  });
});
