import "jest-extended";
import { IntervalSystem } from ".";
import { World } from "../world";

describe("interval system", () => {
  class MyIntervalSystem extends IntervalSystem {
    private callback: jest.Func;

    constructor(interval: number, delay: number, callback: jest.Func) {
      super(interval, delay);
      this.callback = callback;
    }

    run(): void {
      this.callback();
    }
  }

  it("should call process at a regular interval", () => {
    let callback = jest.fn();
    let world = new World();
    let interval = 10;
    let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

    world.addSystem(myIntervalSystem).start();

    world.runSystems(5);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(10);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(5);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(9);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(1);
    expect(callback).toHaveBeenCalled();
  });

  it("should not call process if disabled", () => {
    let callback = jest.fn();
    let world = new World();
    let interval = 10;
    let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

    world.addSystem(myIntervalSystem).start();

    callback.mockClear();
    world.runSystems(10);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(9);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    myIntervalSystem.setEnabled(false);
    world.runSystems(1);
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    myIntervalSystem.setEnabled(true);
    world.runSystems(1);
    expect(callback).toHaveBeenCalled();
  });

  describe("delta time bigger than system's interval", () => {
    it("should call process at every world.process until it is not late anymore", () => {
      let callback = jest.fn();
      let world = new World();
      let interval = 10;
      let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

      world.addSystem(myIntervalSystem).start();

      callback.mockClear();
      world.runSystems(30);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(0);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(0);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(10);
      expect(callback).toHaveBeenCalled();
    });

    it("should call process only once", () => {
      let callback = jest.fn();
      let world = new World();
      let interval = 25;
      let myIntervalSystem = new MyIntervalSystem(interval, interval, callback);
      myIntervalSystem.setCatchUp(false);

      world.addSystem(myIntervalSystem).start();

      callback.mockClear();
      world.runSystems(30);
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(19);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(0);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(1);
      expect(callback).toHaveBeenCalled();
    });
  });
});
