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

    expect(entity.allComponents()).toMatchObject([A, B]);

    world.queueDestroy(entity);
    expect(entity.allComponents()).toMatchObject([A, B]);
    expect(entity.isAlive()).toBeTrue();
    expect(managerComponentA.fetch(entity)).toBeInstanceOf(A);
    expect(managerComponentB.fetch(entity)).toBeInstanceOf(B);

    world.process();
    expect(entity.isAlive()).toBeFalse();
    expect(entity.allComponents()).toMatchObject([]);

    expect(managerComponentA.fetch(entity)).toBeUndefined();
    expect(managerComponentB.fetch(entity)).toBeUndefined();
  });
});
