import "jest-extended";
import { World, Aspect } from "../world";
import { IntervalEntitySystem } from "./index";
import { Entity } from "../entity";

class A {}
class B {}

describe("interval entity system", () => {
  class MyIntervalEntitySystem extends IntervalEntitySystem {
    private fakeCallback: jest.Func;

    constructor(aspect: Aspect, interval: number, callback: jest.Func) {
      super(aspect, interval);
      this.fakeCallback = callback;
    }

    processEntity(_world: World, entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  class MyIntervalEntitySystemWithDelay extends IntervalEntitySystem {
    private fakeCallback: jest.Func;

    constructor(interval: number, delay: number, callback: jest.Func) {
      super(new Aspect(), interval, delay);
      this.fakeCallback = callback;
    }

    processEntity(_world: World, entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  it("should process matching entities at regular interval", () => {
    let callback = jest.fn();
    let world = new World();
    let aspect = new Aspect().with(A).without(B);
    let interval = 10;
    let myIntervalSystem = new MyIntervalEntitySystem(
      aspect,
      interval,
      callback
    );

    world
      .registerComponent(A)
      .registerComponent(B)
      .addSystem(myIntervalSystem)
      .start();

    let entityA = world.create();
    let entityB = world.create();
    world.getStore(A)!.set(entityA, new A());
    world.getStore(A)!.set(entityB, new A());

    world.runSystems(5);
    expect(callback).not.toHaveBeenCalled();

    world.runSystems(5);
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).toHaveBeenCalledWith(entityB);

    callback.mockClear();
    world.getStore(B)!.set(entityB, new B());
    world.runSystems(10);
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).not.toHaveBeenCalledWith(entityB);

    callback.mockClear();
    world.runSystems(9);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.getStore(B)!.remove(entityB);
    world.runSystems(1);
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).toHaveBeenCalledWith(entityB);
  });

  it("should delay the interval function when delay is set", () => {
    let callback = jest.fn();
    let world = new World();
    let interval = 10;
    let initialDelay = 15;
    let system = new MyIntervalEntitySystemWithDelay(
      interval,
      initialDelay,
      callback
    );

    world.addSystem(system).start();

    let entity = world.create();

    callback.mockClear();
    world.runSystems(10); // 15 - 10 = 5
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    system.setEnabled(false);
    world.runSystems(10); // no change
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    system.setEnabled(true);
    world.runSystems(10); // 5 - 10 = -5, -5 + 10 = 5
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(5); // 5 - 5 = 0, 0 + 10 = 10
    expect(callback).toHaveBeenCalledWith(entity);

    callback.mockClear();
    world.runSystems(5); // 10 - 5 = 5
    expect(callback).not.toHaveBeenCalledWith(entity);
  });

  describe("delta time bigger than system's interval", () => {
    it("should call process every time world.runSystems() is called until the system catches up its delay", () => {
      let callback = jest.fn();
      let world = new World();
      let aspect = new Aspect();
      let interval = 10;
      let myIntervalSystem = new MyIntervalEntitySystem(
        aspect,
        interval,
        callback
      );

      world.addSystem(myIntervalSystem).start();

      let entity = world.create();

      callback.mockClear();
      world.runSystems(30);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.runSystems(0);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.runSystems(0);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.runSystems(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("only calls process once if catchUpDelay is set to false", () => {
      let callback = jest.fn();
      let world = new World();
      let aspect = new Aspect();
      let interval = 20;
      let myIntervalSystem = new MyIntervalEntitySystem(
        aspect,
        interval,
        callback
      );
      myIntervalSystem.setCatchUp(false);

      world.addSystem(myIntervalSystem).start();

      let entity = world.create();

      callback.mockClear();
      world.runSystems(259);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.runSystems(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(1);
      expect(callback).toHaveBeenCalledWith(entity);
    });
  });
});
