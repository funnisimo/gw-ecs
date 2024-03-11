import "jest-extended";
import { Aspect, World } from "../world";
import { EntitySystem } from "./index";

class A {}
class B {}
class C {}

describe("entity system", () => {
  class MyEntitySytem extends EntitySystem {
    constructor(aspect: Aspect) {
      super(aspect);
    }

    processEntity(): void {}
  }

  it("use its aspect to check whether an entity match or not", () => {
    let aspectA = new Aspect().with(A).one(B);
    let aspectB = new Aspect().one(B).without(C);
    let systemA = new MyEntitySytem(aspectA);
    let systemB = new MyEntitySytem(aspectB);

    let world = new World();
    world
      .registerComponent(A)
      .registerComponent(B)
      .registerComponent(C)
      // .addSystem(systemA)
      // .addSystem(systemB)
      .start();

    let entity = world.create();

    entity.set(new A());
    expect(systemA.accept(entity)).toBeFalse();
    entity.set(new B());
    expect(systemA.accept(entity)).toBeTrue();
    entity.remove(A);
    expect(systemA.accept(entity)).toBeFalse();
    entity.set(new C());
    expect(systemA.accept(entity)).toBeFalse();

    entity.remove(C);
    expect(systemB.accept(entity)).toBeTrue();
    entity.set(new B());
    expect(systemB.accept(entity)).toBeTrue();

    entity.remove(A);
    expect(systemB.accept(entity)).toBeTrue();
    entity.set(new C());
    expect(systemB.accept(entity)).toBeFalse();
  });

  it("can use aspect events", () => {
    const aspectA = new Aspect().added(A);
    const aspectB = new Aspect().updated(A);
    const systemA = new MyEntitySytem(aspectA);
    const systemB = new MyEntitySytem(aspectB);

    const world = new World();
    world
      .registerComponent(A)
      .registerComponent(B)
      .registerComponent(C)
      .addSystem(systemA)
      .addSystem(systemB)
      .start();

    let entity = world.create();

    world.addTime(1).runSystems();
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeFalse();

    entity.set(new A());
    expect(systemA.accept(entity)).toBeTrue();
    expect(systemB.accept(entity)).toBeTrue();

    world.addTime(1).runSystems();
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeFalse();

    entity.update(A);
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeTrue();

    world.addTime(1).runSystems();
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeFalse();
  });
});
