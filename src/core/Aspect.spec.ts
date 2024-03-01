import "jest-extended";
import { Aspect } from "./index";

class A {}
class B {}
class C {}
class D {}
class E {}
class F {}
class G {}

describe("Aspect", () => {
  describe("all", () => {
    it("should accepts entity if it has all the required components", () => {
      let aspect = new Aspect().all(A, B, C);
      let result = aspect.accept([A, B, C]);
      expect(result).toBeTrue();
    });
    it("should refuses entity if it has not all the required components", () => {
      let aspect = new Aspect().all(A, B, C);
      let result = aspect.accept([A, C]);
      expect(result).toBeFalse();
    });
  });

  describe("one", () => {
    it("should accepts entity if it has at least one of the required components", () => {
      let aspect = new Aspect().one(A, B, C);
      expect(aspect.accept([A])).toBeTrue();
      expect(aspect.accept([B])).toBeTrue();
      expect(aspect.accept([C])).toBeTrue();
      expect(aspect.accept([A, E])).toBeTrue();
      expect(aspect.accept([A, B])).toBeFalse(); // It has 2, but only 1 is the filter
    });
    it("should refuses entity if it has none of all the required components", () => {
      let aspect = new Aspect().one(A, B, C);
      expect(aspect.accept([])).toBeFalse();
      expect(aspect.accept([D])).toBeFalse();
    });
  });

  describe("none", () => {
    it("should accepts entity if it has none of the excluded components", () => {
      let aspect = new Aspect().none(A, B, C);
      expect(aspect.accept([])).toBeTrue();
      expect(aspect.accept([E])).toBeTrue();
    });
    it("should refuses entity if it has any of the excluded components", () => {
      let aspect = new Aspect().none(A, B, C);
      expect(aspect.accept([A])).toBeFalse();
      expect(aspect.accept([A, D])).toBeFalse();
    });
  });

  describe("combinations", () => {
    it("all and one", () => {
      let aspect = new Aspect().all(A, B).one(C, D);
      expect(aspect.accept([A, B])).toBeFalse();
      expect(aspect.accept([A, B, C])).toBeTrue();
      expect(aspect.accept([A, B, D])).toBeTrue();
      expect(aspect.accept([A, C, D])).toBeFalse();
      expect(aspect.accept([A, B, C, D])).toBeFalse(); // We want only 1
      expect(aspect.accept([A, B, C, E])).toBeTrue();
    });

    it("all and none", () => {
      let aspect = new Aspect().all(A, B).none(C, D);
      expect(aspect.accept([A, B])).toBeTrue();
      expect(aspect.accept([A, B, C])).toBeFalse();
      expect(aspect.accept([A, B, D])).toBeFalse();
      expect(aspect.accept([A, B, C, D])).toBeFalse();
      expect(aspect.accept([A, C])).toBeFalse();
      expect(aspect.accept([A, D])).toBeFalse();
    });

    it("one and none", () => {
      let aspect = new Aspect().one(A, B).none(C, D);
      expect(aspect.accept([])).toBeFalse();
      expect(aspect.accept([A])).toBeTrue();
      expect(aspect.accept([B])).toBeTrue();
      expect(aspect.accept([A, C])).toBeFalse();
      expect(aspect.accept([E, D])).toBeFalse();
      expect(aspect.accept([C, D])).toBeFalse();
    });

    it("all, one and none", () => {
      let aspect = new Aspect().all(A, B).one(C, D).none(E);
      expect(aspect.accept([A, B])).toBeFalse();
      expect(aspect.accept([A, B, C])).toBeTrue();
      expect(aspect.accept([A, B, D])).toBeTrue();
      expect(aspect.accept([A, B, C, D])).toBeFalse(); // It has 2, but we want only 1
      expect(aspect.accept([A, B, C, E])).toBeFalse();
      expect(aspect.accept([A, C, D])).toBeFalse();
      expect(aspect.accept([A, B, C, D, F])).toBeFalse(); // It has 2, but we want only 1
    });

    it("all, one, some, and none", () => {
      let aspect = new Aspect().all(A, B).one(C, D).some(E, F).none(G);
      expect(aspect.accept([A, B])).toBeFalse();
      expect(aspect.accept([A, B, C])).toBeFalse();
      expect(aspect.accept([A, B, D])).toBeFalse();
      expect(aspect.accept([A, B, C, D, E])).toBeFalse();
      expect(aspect.accept([A, B, C, E])).toBeTrue();
      expect(aspect.accept([A, B, C, E, F])).toBeTrue();
      expect(aspect.accept([A, B, C, E, G])).toBeFalse();
    });
  });
});
