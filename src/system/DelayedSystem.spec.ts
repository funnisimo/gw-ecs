import "jest-extended";
import { DelayedSystem } from "./intervalSystem";
import { World } from "../world";

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
