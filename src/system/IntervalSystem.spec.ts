import "jest-extended";
import { IntervalSystem } from "../system";
import { World } from "../core";

describe("interval system", () => {
  class MyIntervalSystem extends IntervalSystem {
    private callback: jest.Func;

    constructor(interval: number, delay: number, callback: jest.Func) {
      super(interval, delay);
      this.callback = callback;
    }

    protected processSystem(): void {
      this.callback();
    }
  }

  it("should call process at a regular interval", () => {
    let callback = jest.fn();
    let world = new World();
    let interval = 10;
    let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

    world.addSystem(myIntervalSystem).init();

    world.process(5);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.process(10);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.process(5);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.process(9);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.process(1);
    expect(callback).toHaveBeenCalled();
  });

  it("should not call process if disabled", () => {
    let callback = jest.fn();
    let world = new World();
    let interval = 10;
    let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

    world.addSystem(myIntervalSystem).init();

    callback.mockClear();
    world.process(10);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.process(9);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    myIntervalSystem.setEnable(false);
    world.process(1);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    myIntervalSystem.setEnable(true);
    world.process(1);
    expect(callback).toHaveBeenCalled();
  });

  describe("delta time bigger than system's interval", () => {
    it("should call process at every world.process until it is not late anymore", () => {
      let callback = jest.fn();
      let world = new World();
      let interval = 10;
      let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

      world.addSystem(myIntervalSystem).init();

      callback.mockClear();
      world.process(30);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.process(0);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.process(0);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.process(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.process(10);
      expect(callback).toHaveBeenCalled();
    });

    it("should call process only once", () => {
      let callback = jest.fn();
      let world = new World();
      let interval = 25;
      let myIntervalSystem = new MyIntervalSystem(interval, interval, callback);
      myIntervalSystem.enableCatchUpDelay(false);

      world.addSystem(myIntervalSystem).init();

      callback.mockClear();
      world.process(30);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.process(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.process(19);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.process(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.process(1);
      expect(callback).toHaveBeenCalled();
    });
  });
});
