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
      world.registerComponents(A, B, C, D, E, F, G);
      world.start();
    });

    it("should matchs entity if it has all the required components", () => {
      let aspect = new Aspect().with(A, B, C);
      const entity = world.create();
      entity.set(new A());
      entity.set(new B());
      entity.set(new C());
      expect(aspect.match(entity)).toBeTrue();
    });

    it("should refuses entity if it has not all the required components", () => {
      let aspect = new Aspect().with(A, B, C);
      const entity = world.create();
      entity.set(new A());
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse();
    });
  });

  describe("one", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponents(A, B, C, D, E, F, G);
      world.start();
    });

    it("should matchs entity if it has at least one of the required components", () => {
      let aspect = new Aspect().oneOf(A, B, C);
      const entityA = world.create();
      entityA.set(new A());
      expect(aspect.match(entityA)).toBeTrue();
      const entityB = world.create();
      entityB.set(new B());
      expect(aspect.match(entityB)).toBeTrue();
      const entityC = world.create();
      entityC.set(new C());
      expect(aspect.match(entityC)).toBeTrue();
      entityA.set(new E());
      expect(aspect.match(entityA)).toBeTrue();
      entityB.set(new A());
      expect(aspect.match(entityB)).toBeFalse(); // It has 2, but only 1 is the filter
    });
    it("should refuses entity if it has none of all the required components", () => {
      let aspect = new Aspect().oneOf(A, B, C);
      const entity = world.create();
      expect(aspect.match(entity)).toBeFalse();
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse();
    });
  });

  describe("none", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponents(A, B, C, D, E, F, G);
      world.start();
    });

    it("should accepts entity if it has none of the excluded components", () => {
      let aspect = new Aspect().without(A, B, C);
      const entity = world.create();
      expect(aspect.match(entity)).toBeTrue();
      entity.set(new E());
      expect(aspect.match(entity)).toBeTrue();
    });
    it("should refuses entity if it has any of the excluded components", () => {
      let aspect = new Aspect().without(A, B, C);
      const entity = world.create();
      expect(aspect.match(entity)).toBeTrue();
      entity.set(new A());
      expect(aspect.match(entity)).toBeFalse();
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse();
    });
  });

  describe("combinations", () => {
    let world: World;
    beforeAll(() => {
      world = new World();
      world.registerComponents(A, B, C, D, E, F, G);
      world.start();
    });

    it("all and one", () => {
      let aspect = new Aspect().with(A, B).oneOf(C, D);
      const entity = world.create();
      entity.set(new A());
      entity.set(new B());
      expect(aspect.match(entity)).toBeFalse();
      entity.set(new C());
      expect(aspect.match(entity)).toBeTrue();
      entity.remove(C);
      entity.set(new D());
      expect(aspect.match(entity)).toBeTrue();
      entity.remove(B);
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse();
      entity.set(new B());
      expect(aspect.match(entity)).toBeFalse(); // We want only 1
      entity.remove(D);
      entity.set(new E());
      expect(aspect.match(entity)).toBeTrue();
    });

    it("all and none", () => {
      let aspect = new Aspect().with(A, B).without(C, D);
      const entity = world.create();
      entity.set(new A());
      entity.set(new B());
      expect(aspect.match(entity)).toBeTrue(); // A, B
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C]
      entity.remove(C);
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, D]
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C, D]
      entity.remove(B);
      entity.remove(D);
      expect(aspect.match(entity)).toBeFalse(); // [A, C]
      entity.remove(C);
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse(); // [A, D]
    });

    it("one and none", () => {
      let aspect = new Aspect().oneOf(A, B).without(C, D);
      let entity = world.create();
      expect(aspect.match(entity)).toBeFalse(); // []
      entity.set(new A());
      expect(aspect.match(entity)).toBeTrue(); // [A]
      entity.remove(A);
      entity.set(new B());
      expect(aspect.match(entity)).toBeTrue(); // [A]
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse(); // [A, C]
      entity = world.create();
      entity.set(new E());
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse(); // [E, D]
      entity.remove(E);
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse(); // [C, D]
    });

    it("all, one and none", () => {
      let aspect = new Aspect().with(A, B).oneOf(C, D).without(E);
      let entity = world.create();
      entity.set(new A());
      entity.set(new B());
      expect(aspect.match(entity)).toBeFalse(); // [A, B]
      entity.set(new C());
      expect(aspect.match(entity)).toBeTrue(); // [A, B, C]
      entity.remove(C);
      entity.set(new D());
      expect(aspect.match(entity)).toBeTrue(); // [A, B, D]
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C, D] - It has 2, but we want only 1
      entity.remove(D);
      entity.set(new E());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C, E]
      entity = world.create();
      entity.set(new A());
      entity.set(new C());
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse(); // [A, C, D]
      entity.set(new B());
      entity.set(new F());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C, D, F] - It has 2, but we want only 1
    });

    it("all, one, some, and none", () => {
      let aspect = new Aspect().with(A, B).oneOf(C, D).someOf(E, F).without(G);
      let entity = world.create();
      entity.set(new A());
      entity.set(new B());
      expect(aspect.match(entity)).toBeFalse(); // [A, B]
      entity.set(new C());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C]
      entity.remove(C);
      entity.set(new D());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, D]
      entity.set(new C());
      entity.set(new E());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C, D, E]
      entity.remove(D);
      expect(aspect.match(entity)).toBeTrue(); // [A, B, C, E]
      entity.set(new F());
      expect(aspect.match(entity)).toBeTrue(); // [A, B, C, E, F]
      entity.remove(F);
      entity.set(new G());
      expect(aspect.match(entity)).toBeFalse(); // [A, B, C, E, G]
    });
  });

  describe("with added, updated, removed", () => {
    test.todo(".added(A)");
    test.todo(".updated(A)");
    test.todo(".removed(A)");
    test.todo(".added(A).updated(B).removed(C).with(D,E).without(F)");
  });

  describe("keys, entries", () => {
    test("simple", () => {
      const world = new World();
      world.registerComponent(A).registerComponent(B);
      world.start();

      const e1 = world.create();
      const e2 = world.create();
      const e3 = world.create();

      const a = new A();
      e1.set(a);
      e2.set(new A());

      const b = new B();
      e1.set(b);
      e3.set(new B());

      // 1 = A + B
      // 2 = A
      // 3 = B

      const aspect = new Aspect().with(A, B);
      expect([...aspect.all(world)]).toEqual([e1]);
      expect([...aspect.allEntries(world)]).toEqual([[e1, [a, b]]]);
    });
  });
});
