import "jest-extended";
import { World } from "../world";

class A {}

describe("Store", () => {
  describe("Basics", () => {
    it("lifecycle", () => {
      let world = new World();
      world.registerComponent(A);
      world.init();

      let entity = world.create();
      let store = world.getStore(A);

      let component = store.fetch(entity);
      expect(component).toBeUndefined();

      expect(store.has(entity)).toBeFalse();
      expect(store.fetch(entity)).toBeUndefined();
      expect(store.update(entity)).toBeUndefined();
      store.remove(entity);

      const a = new A();
      store.add(entity, a);
      expect(store.has(entity)).toBeTrue();
      expect(store.fetch(entity)).toBe(a);
      expect(store.update(entity)).toBe(a);

      store.remove(entity);
      expect(store.has(entity)).toBeFalse();
      expect(store.fetch(entity)).toBeUndefined();
      expect(store.update(entity)).toBeUndefined();

      store.add(entity, a);
      // These are done by world...
      store.destroyEntity(entity); // TODO - take this out of interface
      entity._destroy();
      //

      // working on dead entities...
      store.add(entity, a);
      expect(store.has(entity)).toBeFalse();
      expect(store.fetch(entity)).toBeUndefined();
      expect(store.update(entity)).toBeUndefined();
      store.remove(entity);
    });

    test("iterators", () => {
      const world = new World();
      world.registerComponent(A);
      world.init();

      const store = world.getStore(A);
      const a1 = new A();
      const e1 = world.create(a1);
      const a2 = new A();
      const e2 = world.create(a2);
      world.create();

      expect([...store.entities()]).toEqual([e1, e2]);
      expect([...store.values()]).toEqual([a1, a2]);
      expect([...store.entries()]).toEqual([
        [e1, a1],
        [e2, a2],
      ]);
    });
  });
});
