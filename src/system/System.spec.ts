import "jest-extended";
import { World, System } from "../index";

describe("System", () => {
  class SystemTest extends System {
    public callback: jest.Func;

    constructor(callback: jest.Func) {
      super();
      this.callback = callback;
    }

    beforeProcess(): void {
      this.callback("beforeProcess");
    }

    protected processSystem(): void {
      this.callback("processSystem");
    }

    afterProcess(): void {
      this.callback("afterProcess");
    }
  }

  it("call the System process method on world update", () => {
    let world = new World();
    let callback = jest.fn();
    let system = new SystemTest(callback);

    world.addSystem(system);
    world.init();
    world.process();

    expect(callback).toHaveBeenCalledWith("beforeProcess");
    expect(callback).toHaveBeenCalledWith("processSystem");
    expect(callback).toHaveBeenCalledWith("afterProcess");
  });

  it("will call processSystem only if the system is not active", () => {
    let world = new World();
    let callback = jest.fn();
    let system = new SystemTest(callback);

    world.addSystem(system);
    system.setEnable(false);
    world.init();
    world.process();

    expect(callback).not.toHaveBeenCalled();

    system.setEnable(true);
    world.process();

    expect(callback).toHaveBeenCalledWith("beforeProcess");
    expect(callback).toHaveBeenCalledWith("processSystem");
    expect(callback).toHaveBeenCalledWith("afterProcess");
  });
});
