import "jest-extended";
import { DelayedSystem } from "./delayedSystem";
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

    world.runSystems(5);
    expect(callback).not.toHaveBeenCalled();

    world.runSystems(5);
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    world.runSystems(10);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should not update delay if the system is disabled", () => {
    let world = new World();
    let callback = jest.fn();
    world.addSystem(new MyDelayedSystem(10, callback), false).start();

    world.runSystems(20);
    expect(callback).not.toHaveBeenCalled();
  });

  describe("delayed system addDelay", () => {
    it("should add delay to the system timer", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MyDelayedSystem(10, callback);
      world.addSystem(system).start();

      world.runSystems(5);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      system.runIn(10);
      world.runSystems(5);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      world.runSystems(10);
      expect(callback).toHaveBeenCalled();
    });

    it("can add delay and disable system at the same time", () => {
      let world = new World();
      let callback = jest.fn();
      let system = new MyDelayedSystem(10, callback);
      world.addSystem(system).start();

      world.runSystems(5);
      expect(callback).not.toHaveBeenCalled();

      callback.mockClear();
      system.runIn(10);
      expect(system.isEnabled()).toBeTrue();

      world.runSystems(15);
      expect(callback).toHaveBeenCalled();
      expect(system.isEnabled()).toBeFalse();
    });
  });
});
