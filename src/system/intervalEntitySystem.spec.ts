import "jest-extended";
import { World } from "../world";
import { IntervalEntitySystem, DelayedEntitySystem } from "./index";
import { Entity, Aspect } from "../entity";

class A {}
class B {}

describe("interval entity system", () => {
  class MyIntervalEntitySystem extends IntervalEntitySystem {
    private fakeCallback: jest.Func;

    constructor(aspect: Aspect, interval: number, callback: jest.Func) {
      super(aspect, interval);
      this.fakeCallback = callback;
    }

    runEntity(_world: World, entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  class MyIntervalEntitySystemWithDelay extends IntervalEntitySystem {
    private fakeCallback: jest.Func;

    constructor(interval: number, delay: number, callback: jest.Func) {
      super(new Aspect(), interval, delay);
      this.fakeCallback = callback;
    }

    runEntity(_world: World, entity: Entity): void {
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

    world.addTime(5).runSystems();
    expect(callback).not.toHaveBeenCalled();

    world.addTime(5).runSystems();
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).toHaveBeenCalledWith(entityB);

    callback.mockClear();
    world.getStore(B)!.set(entityB, new B());
    world.addTime(10).runSystems();
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).not.toHaveBeenCalledWith(entityB);

    callback.mockClear();
    world.addTime(9).runSystems();
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.getStore(B)!.remove(entityB);
    world.addTime(1).runSystems();
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
    world.addTime(10).runSystems(); // 15 - 10 = 5
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    system.setEnabled(false);
    world.addTime(10).runSystems(); // no change
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    system.setEnabled(true);
    world.addTime(10).runSystems(); // 5 - 10 = -5, -5 + 10 = 5
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.addTime(5).runSystems(); // 5 - 5 = 0, 0 + 10 = 10
    expect(callback).toHaveBeenCalledWith(entity);

    callback.mockClear();
    world.addTime(5).runSystems(); // 10 - 5 = 5
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
      world.addTime(30).runSystems();
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.addTime(0).runSystems();
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
      world.addTime(259).runSystems();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.addTime(1).runSystems();
      expect(callback).toHaveBeenCalledWith(entity);
    });
  });
});

describe("delayed entity system", () => {
  class MyDelayedEntitySystem extends DelayedEntitySystem {
    private fakeCallback: jest.Func;

    constructor(callback: jest.Func, delay: number, aspect: Aspect) {
      super(aspect, delay);
      this.fakeCallback = callback;
    }

    public runEntity(_world: World, entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  class A {}

  it("should not be process if disabled", () => {
    let world = new World();
    let fakeCallback = jest.fn();
    let myDelayedEntitySystem = new MyDelayedEntitySystem(
      fakeCallback,
      10,
      new Aspect().with(A)
    );

    world.registerComponent(A).addSystem(myDelayedEntitySystem).start();

    let entity = world.create();
    entity.set(new A());

    world.addTime(5).runSystems();
    expect(fakeCallback).not.toHaveBeenCalled();

    let entity2 = world.create();
    entity2.set(new A());

    myDelayedEntitySystem.setEnabled(false);
    world.addTime(10).runSystems();
    expect(fakeCallback).not.toHaveBeenCalled();

    myDelayedEntitySystem.setEnabled(true);
    world.addTime(5).runSystems();
    expect(fakeCallback).toHaveBeenCalledTimes(2); // Delay is for system, not per entity
    expect(fakeCallback).toHaveBeenCalledWith(entity);
    expect(fakeCallback).toHaveBeenCalledWith(entity2);
  });
});
