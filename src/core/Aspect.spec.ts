import "jest-extended";
import { Aspect } from "./index";

describe("Aspect", () => {
  describe("all", () => {
    it("should accepts entity if it has all the required components", () => {
      let aspect = new Aspect().all("a", "b", "c");
      let result = aspect.accept(["a", "b", "c"]);
      expect(result).toBeTrue();
    });
    it("should refuses entity if it has not all the required components", () => {
      let aspect = new Aspect().all("a", "b", "c");
      let result = aspect.accept(["a", "c"]);
      expect(result).toBeFalse();
    });
  });

  describe("one", () => {
    it("should accepts entity if it has at least one of the required components", () => {
      let aspect = new Aspect().one("a", "b", "c");
      expect(aspect.accept(["a"])).toBeTrue();
      expect(aspect.accept(["b"])).toBeTrue();
      expect(aspect.accept(["c"])).toBeTrue();
      expect(aspect.accept(["a", "e"])).toBeTrue();
      expect(aspect.accept(["a", "b"])).toBeFalse(); // It has 2, but only 1 is the filter
    });
    it("should refuses entity if it has none of all the required components", () => {
      let aspect = new Aspect().one("a", "b", "c");
      expect(aspect.accept([])).toBeFalse();
      expect(aspect.accept(["d"])).toBeFalse();
    });
  });

  describe("none", () => {
    it("should accepts entity if it has none of the excluded components", () => {
      let aspect = new Aspect().none("a", "b", "c");
      expect(aspect.accept([])).toBeTrue();
      expect(aspect.accept(["e"])).toBeTrue();
    });
    it("should refuses entity if it has any of the excluded components", () => {
      let aspect = new Aspect().none("a", "b", "c");
      expect(aspect.accept(["a"])).toBeFalse();
      expect(aspect.accept(["a", "d"])).toBeFalse();
    });
  });

  describe("combinations", () => {
    it("all and one", () => {
      let aspect = new Aspect().all("a", "b").one("c", "d");
      expect(aspect.accept(["a", "b"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c"])).toBeTrue();
      expect(aspect.accept(["a", "b", "d"])).toBeTrue();
      expect(aspect.accept(["a", "c", "d"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c", "d"])).toBeFalse(); // We want only 1
      expect(aspect.accept(["a", "b", "c", "e"])).toBeTrue();
    });

    it("all and none", () => {
      let aspect = new Aspect().all("a", "b").none("c", "d");
      expect(aspect.accept(["a", "b"])).toBeTrue();
      expect(aspect.accept(["a", "b", "c"])).toBeFalse();
      expect(aspect.accept(["a", "b", "d"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c", "d"])).toBeFalse();
      expect(aspect.accept(["a", "c"])).toBeFalse();
      expect(aspect.accept(["a", "d"])).toBeFalse();
    });

    it("one and none", () => {
      let aspect = new Aspect().one("a", "b").none("c", "d");
      expect(aspect.accept([])).toBeFalse();
      expect(aspect.accept(["a"])).toBeTrue();
      expect(aspect.accept(["b"])).toBeTrue();
      expect(aspect.accept(["a", "c"])).toBeFalse();
      expect(aspect.accept(["e", "d"])).toBeFalse();
      expect(aspect.accept(["c", "d"])).toBeFalse();
    });

    it("all, one and none", () => {
      let aspect = new Aspect().all("a", "b").one("c", "d").none("e");
      expect(aspect.accept(["a", "b"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c"])).toBeTrue();
      expect(aspect.accept(["a", "b", "d"])).toBeTrue();
      expect(aspect.accept(["a", "b", "c", "d"])).toBeFalse(); // It has 2, but we want only 1
      expect(aspect.accept(["a", "b", "c", "e"])).toBeFalse();
      expect(aspect.accept(["a", "c", "d"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c", "d", "f"])).toBeFalse(); // It has 2, but we want only 1
    });

    it("all, one, some, and none", () => {
      let aspect = new Aspect()
        .all("a", "b")
        .one("c", "d")
        .some("e", "f")
        .none("g");
      expect(aspect.accept(["a", "b"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c"])).toBeFalse();
      expect(aspect.accept(["a", "b", "d"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c", "d", "e"])).toBeFalse();
      expect(aspect.accept(["a", "b", "c", "e"])).toBeTrue();
      expect(aspect.accept(["a", "b", "c", "e", "f"])).toBeTrue();
      expect(aspect.accept(["a", "b", "c", "e", "g"])).toBeFalse();
    });
  });
});
