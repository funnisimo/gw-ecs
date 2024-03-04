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

    protected processEntity(entity: Entity): void {
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
      world.init();
      let idA = world.create();
      let idB = world.create();
      world.queueDestroy(idA);
      world.process();
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
      let system = new MockSystem(new Aspect().all(A), callback);
      world.registerComponents(A).addSystem(system);
      world.init();

      let entity = world.create();
      entity.add(new A());

      world.process(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // entity is not deleted until sytem 'process' completes...
      callback.mockClear();
      world.queueDestroy(entity);
      world.queueDestroy(entity); // Can remove multiple times
      world.process(0);

      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      world.process(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should not process systems that are initially disabled", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MockSystem(new Aspect().all(A), callback);
      world.registerComponents(A).addSystem(system, false);

      let entity = world.create();
      world.getStore(A).add(entity, new A());
      world.init();

      callback.mockClear();
      world.process(1);
      expect(callback).not.toHaveBeenCalled();
      system.setEnabled(true);

      callback.mockClear();
      world.process(1);
      expect(callback).toHaveBeenCalledWith(entity);
    });
  });

  describe("resources", () => {
    test("basics", () => {
      const world = new World();
      const a = new A();
      world.set(a);
      expect(world.get(A)).toBe(a);

      const a2 = new A();
      world.set(a2);
      expect(world.get(A)).toBe(a2);

      world.delete(A);
      expect(world.get(A)).toBeUndefined();
    });
  });

  describe("entity lifecycle", () => {
    class CreateSystem extends System {
      protected doProcess(): void {
        this.world.create(new A(), new B());
      }
    }

    class DeleteSystem extends EntitySystem {
      protected processEntity(entity: Entity): void {
        this.world.queueDestroy(entity);
      }
    }

    class DeleteNowSystem extends EntitySystem {
      protected processEntity(entity: Entity): void {
        this.world.destroyNow(entity);
      }
    }

    test("queueDelete", () => {
      const sysCreate = new CreateSystem();
      const sysDelete = new DeleteSystem(new Aspect().all(A, B));
      const world = new World();
      world
        .registerComponents(A, B, C)
        .addSystem(sysCreate)
        .addSystem(sysDelete, false)
        .init();

      expect(world.entities().count()).toEqual(0);
      world.process();
      world.process();
      world.process();
      expect(world.entities().count()).toEqual(3);
      sysCreate.setEnabled(false);
      sysDelete.setEnabled(true);
      world.process();
      expect(world.entities().count()).toEqual(0);
    });

    test("queueDelete", () => {
      const sysCreate = new CreateSystem();
      const sysDelete = new DeleteNowSystem(new Aspect().all(A, B));
      const world = new World();
      world
        .registerComponents(A, B, C)
        .addSystem(sysCreate)
        .addSystem(sysDelete, false)
        .init();

      expect(world.entities().count()).toEqual(0);
      world.process();
      world.process();
      world.process();
      expect(world.entities().count()).toEqual(3);
      sysCreate.setEnabled(false);
      sysDelete.setEnabled(true);
      world.process();
      expect(world.entities().count()).toEqual(0);
    });
  });
});
