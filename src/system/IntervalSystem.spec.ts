import "jest-extended";
import { IntervalSystem } from ".";
import { World } from "../world";

describe("interval system", () => {
  class MyIntervalSystem extends IntervalSystem {
    callback: jest.Func;

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

    world.addTime(5).runSystems();
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.addTime(10).runSystems();
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.addTime(5).runSystems();
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.addTime(9).runSystems();
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.addTime(1).runSystems();
    expect(callback).toHaveBeenCalled();
  });

  it("should not call process if disabled", () => {
    let callback = jest.fn();
    let world = new World();
    let interval = 10;
    let myIntervalSystem = new MyIntervalSystem(interval, 10, callback);

    world.addSystem(myIntervalSystem).start();

    callback.mockClear();
    world.addTime(10).runSystems();
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.addTime(9).runSystems();
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    myIntervalSystem.setEnabled(false);
    world.addTime(1).runSystems();
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    myIntervalSystem.setEnabled(true);
    world.addTime(1).runSystems();
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
      world.addTime(30).runSystems();
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.addTime(10).runSystems();
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
      world.addTime(30).runSystems();
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.addTime(19).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.addTime(0).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.addTime(1).runSystems();
      expect(callback).toHaveBeenCalled();
    });
  });
});
