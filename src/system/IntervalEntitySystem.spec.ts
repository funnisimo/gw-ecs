import "jest-extended";
import { World, Aspect, Entity } from "../core";
import { IntervalEntitySystem } from "./index";

class A {}
class B {}

describe("interval entity system", () => {
  class MyIntervalEntitySystem extends IntervalEntitySystem {
    private fakeCallback: jest.Func;

    constructor(aspect: Aspect, interval: number, callback: jest.Func) {
      super(aspect, interval);
      this.fakeCallback = callback;
    }

    protected processEntity(entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  class MyIntervalEntitySystemWithDelay extends IntervalEntitySystem {
    private fakeCallback: jest.Func;

    constructor(interval: number, delay: number, callback: jest.Func) {
      super(new Aspect(), interval, delay);
      this.fakeCallback = callback;
    }

    protected processEntity(entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  it("should process matching entities at regular interval", () => {
    let callback = jest.fn();
    let world = new World();
    let aspect = new Aspect().all(A).none(B);
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
      .init();

    let entityA = world.create();
    let entityB = world.create();
    world.getComponent(A).add(entityA, new A());
    world.getComponent(A).add(entityB, new A());

    world.process(5);
    expect(callback).not.toHaveBeenCalled();

    world.process(5);
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).toHaveBeenCalledWith(entityB);

    callback.mockClear();
    world.getComponent(B).add(entityB, new B());
    world.process(10);
    expect(callback).toHaveBeenCalledWith(entityA);
    expect(callback).not.toHaveBeenCalledWith(entityB);

    callback.mockClear();
    world.process(9);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.getComponent(B).remove(entityB);
    world.process(1);
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

    world.addSystem(system).init();

    let entity = world.create();

    callback.mockClear();
    world.process(10); // 15 - 10 = 5
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    system.setEnabled(false);
    world.process(10); // no change
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    system.setEnabled(true);
    world.process(10); // 5 - 10 = -5, -5 + 10 = 5
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.process(5); // 5 - 5 = 0, 0 + 10 = 10
    expect(callback).toHaveBeenCalledWith(entity);

    callback.mockClear();
    world.process(5); // 10 - 5 = 5
    expect(callback).not.toHaveBeenCalledWith(entity);
  });

  describe("delta time bigger than system's interval", () => {
    it("should call process every time world.process() is called until the system catches up its delay", () => {
      let callback = jest.fn();
      let world = new World();
      let aspect = new Aspect();
      let interval = 10;
      let myIntervalSystem = new MyIntervalEntitySystem(
        aspect,
        interval,
        callback
      );

      world.addSystem(myIntervalSystem).init();

      let entity = world.create();

      callback.mockClear();
      world.process(30);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.process(0);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.process(0);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.process(0);
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
      myIntervalSystem.enableCatchUpDelay(false);

      world.addSystem(myIntervalSystem).init();

      let entity = world.create();

      callback.mockClear();
      world.process(259);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(entity);

      callback.mockClear();
      world.process(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.process(1);
      expect(callback).toHaveBeenCalledWith(entity);
    });
  });
});
