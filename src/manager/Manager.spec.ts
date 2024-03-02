import "jest-extended";
import { World } from "../core";

class A {}

describe("manager", () => {
  describe("manager fetch", () => {
    it("no default values", () => {
      let world = new World();
      world.registerComponent(A);
      world.init();

      let entity = world.create();
      let manager = world.getComponent(A);

      let component = manager.fetch(entity);
      expect(component).toBeUndefined();
    });
  });
});
