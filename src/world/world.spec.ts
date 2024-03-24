import "jest-extended";
import { World, Aspect } from ".";
import { Entity } from "../entity";
import { EntitySystem, System } from "../system";

class A {}
class B {}
class C {}

describe("World", function () {
  class MockSystem extends EntitySystem {
    private callback: jest.Func;

    constructor(aspect: Aspect, callback: jest.Func) {
      super(aspect);
      this.callback = callback;
    }

    runEntity(_world: World, entity: Entity): void {
      this.callback(entity);
    }
  }

  test("stringify", () => {
    const world = new World();
    expect(JSON.stringify(world)).toBeString();

    world.registerComponents(A);
    expect(JSON.stringify(world)).toBeString();

    world.create();
    expect(JSON.stringify(world)).toBeString();
  });

  describe("Entity creation", function () {
    it("should return a different entity id", function () {
      let world = new World();
      let idA = world.create();
      let idB = world.create();
      expect(idA).not.toBe(idB);
    });

    it("should recycle entities when deleted", function () {
      let world = new World();
      world.start();
      let idA = world.create();
      let idB = world.create();
      world.destroyLater(idA);
      world.maintain();
      let idC = world.create();
      let idD = world.create();
      expect(idA.index).toEqual(0);
      expect(idB.index).toEqual(1);
      expect(idC.index).toEqual(0);
      expect(idD.index).toEqual(2);
    });

    it("should remove an entity from a system when it' deleted from world", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MockSystem(new Aspect().with(A), callback);
      world.registerComponents(A).addSystem(system);
      world.start();

      let entity = world.create();
      entity.set(new A());

      world.addTime(0).runSystems();
      expect(callback).toHaveBeenCalledTimes(1);

      // entity is not deleted until sytem 'process' completes...
      callback.mockClear();
      world.destroyLater(entity);
      world.destroyLater(entity); // Can remove multiple times
      world.addTime(0).runSystems();

      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      world.maintain(); // maintain does delayed deletes
      world.addTime(0).runSystems();
      expect(callback).not.toHaveBeenCalled();
    });

    it("should not process systems that are initially disabled", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MockSystem(new Aspect().with(A), callback);
      world.registerComponents(A).addSystem(system, false);

      let entity = world.create();
      world.getStore(A)!.set(entity, new A());
      world.start();

      callback.mockClear();
      world.addTime(1).runSystems();
      expect(callback).not.toHaveBeenCalled();
      system.setEnabled(true);

      callback.mockClear();
      world.addTime(1).runSystems();
      expect(callback).toHaveBeenCalledWith(entity);
    });
  });

  describe("globals", () => {
    test("basics", () => {
      const world = new World();
      const a = new A();
      world.setUnique(a);
      expect(world.getUnique(A)).toBe(a);

      const a2 = new A();
      world.setUnique(a2);
      expect(world.getUnique(A)).toBe(a2);

      world.removeUnique(A);
      expect(world.getUnique(A)).toBeUndefined();
    });
  });

  describe("entity lifecycle", () => {
    class CreateSystem extends System {
      run(world: World): void {
        world.create(new A(), new B());
      }
    }

    class DeleteLaterSystem extends EntitySystem {
      runEntity(world: World, entity: Entity): void {
        world.destroyLater(entity);
      }
    }

    class DeleteNowSystem extends EntitySystem {
      runEntity(world: World, entity: Entity): void {
        world.destroyNow(entity);
      }
    }

    test("queueDelete", () => {
      const sysCreate = new CreateSystem();
      const sysDelete = new DeleteLaterSystem(new Aspect().with(A, B));
      const world = new World();
      world
        .registerComponents(A, B, C)
        .addSystem(sysCreate)
        .addSystem(sysDelete, false)
        .start();

      expect(world.entities().count()).toEqual(0);
      world.runSystems();
      world.runSystems();
      world.runSystems();
      expect(world.entities().count()).toEqual(3);
      sysCreate.setEnabled(false);
      sysDelete.setEnabled(true);
      world.runSystems();
      // Deletes are queued, but not committed
      expect(world.entities().count()).toEqual(3);
      // This does the commit
      world.maintain();
      expect(world.entities().count()).toEqual(0);
    });

    test("deleteNow", () => {
      const sysCreate = new CreateSystem();
      const sysDelete = new DeleteNowSystem(new Aspect().with(A, B));
      const world = new World();
      world
        .registerComponents(A, B, C)
        .addSystem(sysCreate)
        .addSystem(sysDelete, false)
        .start();

      expect(world.entities().count()).toEqual(0);
      world.runSystems();
      world.runSystems();
      world.runSystems();
      expect(world.entities().count()).toEqual(3);
      sysCreate.setEnabled(false);
      sysDelete.setEnabled(true);
      world.runSystems();
      expect(world.entities().count()).toEqual(0);
    });
  });
});
