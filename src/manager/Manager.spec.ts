import "jest-extended";
import { World } from "../core";

class A {
  value = 1;
}

describe("manager", () => {
  describe("manager fetch", () => {
    it("no default values", () => {
      let world = new World();
      world.registerComponent(A);
      world.init();

      let entity = world.create();
      let manager = world.getComponentManager(A);

      let component = manager.fetch(entity);
      expect(component).toBeUndefined();
    });
  });
});
