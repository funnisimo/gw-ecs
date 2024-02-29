import "jest-extended";
import { World, Aspect } from "../core";
import { EntitySystem } from "../system";

describe("World", function () {
  class MockSystem extends EntitySystem {
    private callback: jest.Func;

    constructor(aspect: Aspect, callback: jest.Func) {
      super(aspect);
      this.callback = callback;
    }

    protected process(entity: number): void {
      this.callback(entity);
    }
  }

  describe("Entity creation", function () {
    it("should return a different entity id", function () {
      let world = new World();
      let idA = world.create();
      let idB = world.create();
      expect(idA).not.toBe(idB);
    });

    it("should recycles entities when deleted", function () {
      let world = new World();
      world.init();
      let idA = world.create();
      let idB = world.create();
      world.remove(idA);
      world.process();
      let idC = world.create();
      let idD = world.create();
      expect(idA).toEqual(1);
      expect(idB).toEqual(2);
      expect(idC).toEqual(1);
      expect(idD).toEqual(3);
    });

    it("should remove an entity from a system when it' deleted from world", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MockSystem(new Aspect().all("A"), callback);
      world.registerComponent("A").addSystem(system);

      let entity = world.create();
      world.getComponentManager("A").add(entity);
      world.init();

      world.process(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // entity is not deleted until 'process' completes...
      callback.mockClear();
      world.remove(entity);
      world.remove(entity); // Can remove multiple times
      world.process(0);

      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      world.remove(entity);
      world.process(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should not process systems that are initially disabled", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MockSystem(new Aspect().all("A"), callback);
      world.registerComponent("A").addSystem(system, false);

      let entity = world.create();
      world.getComponentManager("A").add(entity);
      world.init();

      callback.mockClear();
      world.process(1);
      expect(callback).not.toHaveBeenCalled();
      system.setEnable(true);

      callback.mockClear();
      world.process(1);
      expect(callback).toHaveBeenCalledWith(entity);
    });
  });
});
