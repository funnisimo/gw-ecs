import "jest-extended";
import { Aspect, World } from "../world";
import { Entity } from "../entity";
import { EntitySystem } from "./index";

class A {}
class B {}
class C {}

describe("entity system", () => {
  class MyEntitySytem extends EntitySystem {
    constructor(aspect: Aspect) {
      super(aspect);
    }

    protected processEntity(_entity: Entity): void {}
  }

  it("use its aspect to check whether an entity match or not", () => {
    let aspectA = new Aspect().all(A).one(B);
    let aspectB = new Aspect().one(B).none(C);
    let systemA = new MyEntitySytem(aspectA);
    let systemB = new MyEntitySytem(aspectB);

    let world = new World();
    world
      .registerComponent(A)
      .registerComponent(B)
      .registerComponent(C)
      // .addSystem(systemA)
      // .addSystem(systemB)
      .init();

    let entity = world.create();

    entity.add(new A());
    expect(systemA.accept(entity)).toBeFalse();
    entity.add(new B());
    expect(systemA.accept(entity)).toBeTrue();
    entity.remove(A);
    expect(systemA.accept(entity)).toBeFalse();
    entity.add(new C());
    expect(systemA.accept(entity)).toBeFalse();

    entity.remove(C);
    expect(systemB.accept(entity)).toBeTrue();
    entity.add(new B());
    expect(systemB.accept(entity)).toBeTrue();

    entity.remove(A);
    expect(systemB.accept(entity)).toBeTrue();
    entity.add(new C());
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
      .init();

    let entity = world.create();

    world.process(1);
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeFalse();

    entity.add(new A());
    expect(systemA.accept(entity)).toBeTrue();
    expect(systemB.accept(entity)).toBeTrue();

    world.process(1);
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeFalse();

    entity.update(A);
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeTrue();

    world.process(1);
    expect(systemA.accept(entity)).toBeFalse();
    expect(systemB.accept(entity)).toBeFalse();
  });
});
