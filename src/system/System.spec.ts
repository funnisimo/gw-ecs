import "jest-extended";
import { World } from "../world";
import { System } from "./index";

describe("System", () => {
  class SystemTest extends System {
    public callback: jest.Func;

    constructor(callback: jest.Func) {
      super();
      this.callback = callback;
    }

    run(): void {
      this.callback();
    }
  }

  it("call the System process method on world update", () => {
    let world = new World();
    let callback = jest.fn();
    let system = new SystemTest(callback);

    world.addSystem(system);
    world.start();
    world.process();

    expect(callback).toHaveBeenCalled();
  });

  it("will call processSystem only if the system is not active", () => {
    let world = new World();
    let callback = jest.fn();
    let system = new SystemTest(callback);

    world.addSystem(system);
    system.setEnabled(false);
    world.start();
    world.process();

    expect(callback).toHaveBeenCalledTimes(0);

    callback.mockClear();
    system.setEnabled(true);
    world.process();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
