import "jest-extended";
import { System } from "./system.js";
import { SystemManager } from "./manager.js";
import { World } from "../world/world.js";

describe("SystemManager", () => {
  class RunOrder {
    names: string[] = [];

    push(name: string) {
      this.names.push(name);
    }

    get(): string[] {
      return this.names;
    }
  }

  class TestSystem extends System {
    name: string;

    constructor(name: string) {
      super();
      this.name = name;
    }

    protected process(world: World): void {
      world.getGlobal(RunOrder).push(this.name);
    }
  }

  test("configure default systems", () => {
    const manager = new SystemManager();

    manager.addSystem(new TestSystem("a"));
    manager.addSystem(new TestSystem("b"));
    manager.addSystem(new TestSystem("c"));

    const world = new World().setGlobal(new RunOrder());
    manager.start(world);
    manager.run(world, 0, 0);

    expect(world.getGlobal(RunOrder).get()).toEqual(["a", "b", "c"]);
  });

  test("add default steps", () => {
    const manager = new SystemManager();

    manager.addStep("start", { before: "update" });
    manager.addStep("finish", { after: "update" });

    manager.addSystem(new TestSystem("a"), "finish");
    manager.addSystem(new TestSystem("b"), "update");
    manager.addSystem(new TestSystem("c"), "start");

    const defaultSet = manager.getSet()!;
    expect(defaultSet.steps).toHaveLength(3);

    const world = new World().setGlobal(new RunOrder());
    manager.start(world);
    manager.run(world, 0, 0);

    expect(world.getGlobal(RunOrder).get()).toEqual(["c", "b", "a"]);
  });

  test("add set", () => {
    const manager = new SystemManager();

    manager.addSet("panic");
    manager.addStep("panic", "start", { before: "update" });
    manager.addStep("panic", "finish", { after: "update" });

    manager.addSystem(new TestSystem("a"), "panic", "finish");
    manager.addSystem(new TestSystem("b"), "panic", "update");
    manager.addSystem(new TestSystem("c"), "panic", "start");

    const world = new World().setGlobal(new RunOrder());
    manager.start(world);
    manager.runSet("panic", world, 0, 0);

    expect(world.getGlobal(RunOrder).get()).toEqual(["c", "b", "a"]);
  });

  test("add set with steps", () => {
    const manager = new SystemManager();

    manager.addSet("panic", ["start", "update", "finish"]);

    manager.addSystem(new TestSystem("a"), "panic", "finish");
    manager.addSystem(new TestSystem("b"), "panic", "update");
    manager.addSystem(new TestSystem("c"), "panic", "start");

    const world = new World().setGlobal(new RunOrder());
    manager.start(world);
    manager.runSet("panic", world, 0, 0);

    expect(world.getGlobal(RunOrder).get()).toEqual(["c", "b", "a"]);
  });
});
