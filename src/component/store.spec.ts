import "jest-extended";
import { World } from "../world";

class A {}

describe("Store", () => {
  describe("Store fetch", () => {
    it("no default values", () => {
      let world = new World();
      world.registerComponent(A);
      world.init();

      let entity = world.create();
      let store = world.getStore(A);

      let component = store.fetch(entity);
      expect(component).toBeUndefined();
    });
  });
});
