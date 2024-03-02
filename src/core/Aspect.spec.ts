import "jest-extended";
import { World } from "./world";
import { Aspect } from "./aspect";

class A {}
class B {}
class C {}
class D {}
class E {}
class F {}
class G {}

describe("Aspect", () => {
  describe("all", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponent(A, B, C, D, E, F, G);
      world.init();
    });

    it("should accepts entity if it has all the required components", () => {
      let aspect = new Aspect().all(A, B, C);
      const entity = world.create();
      entity.add(new A());
      entity.add(new B());
      entity.add(new C());
      expect(aspect.accept(entity)).toBeTrue();
    });

    it("should refuses entity if it has not all the required components", () => {
      let aspect = new Aspect().all(A, B, C);
      const entity = world.create();
      entity.add(new A());
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse();
    });
  });

  describe("one", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponent(A, B, C, D, E, F, G);
      world.init();
    });

    it("should accepts entity if it has at least one of the required components", () => {
      let aspect = new Aspect().one(A, B, C);
      const entityA = world.create();
      entityA.add(new A());
      expect(aspect.accept(entityA)).toBeTrue();
      const entityB = world.create();
      entityB.add(new B());
      expect(aspect.accept(entityB)).toBeTrue();
      const entityC = world.create();
      entityC.add(new C());
      expect(aspect.accept(entityC)).toBeTrue();
      entityA.add(new E());
      expect(aspect.accept(entityA)).toBeTrue();
      entityB.add(new A());
      expect(aspect.accept(entityB)).toBeFalse(); // It has 2, but only 1 is the filter
    });
    it("should refuses entity if it has none of all the required components", () => {
      let aspect = new Aspect().one(A, B, C);
      const entity = world.create();
      expect(aspect.accept(entity)).toBeFalse();
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse();
    });
  });

  describe("none", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponent(A, B, C, D, E, F, G);
      world.init();
    });

    it("should accepts entity if it has none of the excluded components", () => {
      let aspect = new Aspect().none(A, B, C);
      const entity = world.create();
      expect(aspect.accept(entity)).toBeTrue();
      entity.add(new E());
      expect(aspect.accept(entity)).toBeTrue();
    });
    it("should refuses entity if it has any of the excluded components", () => {
      let aspect = new Aspect().none(A, B, C);
      const entity = world.create();
      expect(aspect.accept(entity)).toBeTrue();
      entity.add(new A());
      expect(aspect.accept(entity)).toBeFalse();
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse();
    });
  });

  describe("combinations", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponent(A, B, C, D, E, F, G);
      world.init();
    });

    it("all and one", () => {
      let aspect = new Aspect().all(A, B).one(C, D);
      const entity = world.create();
      entity.add(new A());
      entity.add(new B());
      expect(aspect.accept(entity)).toBeFalse();
      entity.add(new C());
      expect(aspect.accept(entity)).toBeTrue();
      entity.remove(C);
      entity.add(new D());
      expect(aspect.accept(entity)).toBeTrue();
      entity.remove(B);
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse();
      entity.add(new B());
      expect(aspect.accept(entity)).toBeFalse(); // We want only 1
      entity.remove(D);
      entity.add(new E());
      expect(aspect.accept(entity)).toBeTrue();
    });

    it("all and none", () => {
      let aspect = new Aspect().all(A, B).none(C, D);
      const entity = world.create();
      entity.add(new A());
      entity.add(new B());
      expect(aspect.accept(entity)).toBeTrue(); // A, B
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C]
      entity.remove(C);
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, D]
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C, D]
      entity.remove(B);
      entity.remove(D);
      expect(aspect.accept(entity)).toBeFalse(); // [A, C]
      entity.remove(C);
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse(); // [A, D]
    });

    it("one and none", () => {
      let aspect = new Aspect().one(A, B).none(C, D);
      let entity = world.create();
      expect(aspect.accept(entity)).toBeFalse(); // []
      entity.add(new A());
      expect(aspect.accept(entity)).toBeTrue(); // [A]
      entity.remove(A);
      entity.add(new B());
      expect(aspect.accept(entity)).toBeTrue(); // [A]
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse(); // [A, C]
      entity = world.create();
      entity.add(new E());
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse(); // [E, D]
      entity.remove(E);
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse(); // [C, D]
    });

    it("all, one and none", () => {
      let aspect = new Aspect().all(A, B).one(C, D).none(E);
      let entity = world.create();
      entity.add(new A());
      entity.add(new B());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B]
      entity.add(new C());
      expect(aspect.accept(entity)).toBeTrue(); // [A, B, C]
      entity.remove(C);
      entity.add(new D());
      expect(aspect.accept(entity)).toBeTrue(); // [A, B, D]
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C, D] - It has 2, but we want only 1
      entity.remove(D);
      entity.add(new E());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C, E]
      entity = world.create();
      entity.add(new A());
      entity.add(new C());
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse(); // [A, C, D]
      entity.add(new B());
      entity.add(new F());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C, D, F] - It has 2, but we want only 1
    });

    it("all, one, some, and none", () => {
      let aspect = new Aspect().all(A, B).one(C, D).some(E, F).none(G);
      let entity = world.create();
      entity.add(new A());
      entity.add(new B());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B]
      entity.add(new C());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C]
      entity.remove(C);
      entity.add(new D());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, D]
      entity.add(new C());
      entity.add(new E());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C, D, E]
      entity.remove(D);
      expect(aspect.accept(entity)).toBeTrue(); // [A, B, C, E]
      entity.add(new F());
      expect(aspect.accept(entity)).toBeTrue(); // [A, B, C, E, F]
      entity.remove(F);
      entity.add(new G());
      expect(aspect.accept(entity)).toBeFalse(); // [A, B, C, E, G]
    });
  });

  describe("with added, updated, removed", () => {
    test.todo(".added(A)");
    test.todo(".updated(A)");
    test.todo(".removed(A)");
    test.todo(".added(A).updated(B).removed(C).all(D,E).none(F)");
  });
});
