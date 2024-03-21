import "jest-extended";
import { DelayedSystem, IntervalSystem } from "./intervalSystem";
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

describe("delayed system", () => {
  class MyDelayedSystem extends DelayedSystem {
    private callback: jest.Func;

    constructor(delay: number, callback: jest.Func) {
      super(delay);
      this.callback = callback;
    }

    run(): void {
      this.callback();
    }
  }

  it("should call our system after the given delay", () => {
    let world = new World();
    let callback = jest.fn();
    world.addSystem(new MyDelayedSystem(10, callback)).start();

    world.addTime(5).runSystems();
    expect(callback).not.toHaveBeenCalled();

    world.addTime(5).runSystems();
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.addTime(10).runSystems();
    expect(callback).not.toHaveBeenCalled();
  });

  it("should not update delay if the system is disabled", () => {
    let world = new World();
    let callback = jest.fn();
    world.addSystem(new MyDelayedSystem(10, callback), false).start();

    world.addTime(20).runSystems();
    expect(callback).not.toHaveBeenCalled();
  });

  describe("delayed system addDelay", () => {
    it("should add delay to the system timer", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MyDelayedSystem(10, callback);
      world.addSystem(system).start();

      world.addTime(5).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      system.runIn(10);
      world.addTime(5).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.addTime(10).runSystems();
      expect(callback).toHaveBeenCalled();
    });

    it("can add delay and disable system at the same time", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MyDelayedSystem(10, callback);
      world.addSystem(system).start();

      world.addTime(5).runSystems();
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      system.runIn(10);
      expect(system.isEnabled()).toBeTrue();

      world.addTime(15).runSystems();
      expect(callback).toHaveBeenCalled();
      expect(system.isEnabled()).toBeFalse();
    });
  });
});
