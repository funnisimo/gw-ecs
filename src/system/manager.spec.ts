import "jest-extended";
import { System } from "./system.js";
import { SystemManager } from "./manager.js";
import { World } from "../world/world.js";
import { EntitySystem } from "./entitySystem.js";
import { Aspect } from "../entity/index.js";
import { EntitySystemStep } from "./systemStep.js";
import { EntitySystemSet } from "./systemSet.js";

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

    run(world: World): void {
      world.getUnique(RunOrder).push(this.name);
    }
  }

  test("configure default systems", () => {
    const manager = new SystemManager();

    manager.addSystem(new TestSystem("a"));
    manager.addSystem(new TestSystem("b"));
    manager.addSystem(new TestSystem("c"));

    const world = new World().setUnique(new RunOrder());
    manager.start(world);
    manager.run(world, 0, 0);

    expect(world.getUnique(RunOrder).get()).toEqual(["a", "b", "c"]);
  });

  test("add steps", () => {
    const manager = new SystemManager();

    manager.addStep("start", { before: "update" });
    manager.addStep("finish", { after: "update" });

    const defaultSet = manager.getSet()!;
    expect(defaultSet.steps.map((s) => s.name)).toEqual([
      "start",
      "update",
      "finish",
    ]);

    manager.addSystem("pre-finish", new TestSystem("a"));
    manager.addSystem("update", new TestSystem("b"));
    manager.addSystem("post-start", new TestSystem("c"));

    expect(defaultSet.steps).toHaveLength(3);

    const world = new World().setUnique(new RunOrder());
    manager.start(world);
    manager.run(world, 0, 0);

    expect(world.getUnique(RunOrder).get()).toEqual(["c", "b", "a"]);
  });

  test("add set", () => {
    const manager = new SystemManager();

    manager.addSet("panic");
    manager.addStep("panic", "start", { before: "update" });
    manager.addStep("panic", "finish", { after: "update" });

    manager.addSystem("panic", "post-finish", new TestSystem("a"));
    manager.addSystem("panic", "pre-update", new TestSystem("b"));
    manager.addSystem("panic", "start", new TestSystem("c"));

    const world = new World().setUnique(new RunOrder());
    manager.start(world);
    manager.runSet("panic", world, 0, 0);

    expect(world.getUnique(RunOrder).get()).toEqual(["c", "b", "a"]);
  });

  test("add set with steps", () => {
    const manager = new SystemManager();

    manager.addSet("panic", ["start", "update", "finish"]);

    manager.addSystem("panic", "post-finish", new TestSystem("a"));
    manager.addSystem("panic", "update", new TestSystem("b"));
    manager.addSystem("panic", "pre-start", new TestSystem("c"));

    const world = new World().setUnique(new RunOrder());
    manager.start(world);
    manager.runSet("panic", world, 0, 0);

    expect(world.getUnique(RunOrder).get()).toEqual(["c", "b", "a"]);
  });
});

describe("EntitySystems", () => {
  class TestSystem extends System {
    name: string;

    constructor(name: string) {
      super();
      this.name = name;
    }
  }

  class TestEntitySystem extends EntitySystem {
    name: string;

    constructor(name: string) {
      super(new Aspect());
      this.name = name;
    }
  }

  test("add entity step", () => {
    const mgr = new SystemManager();
    const step = new EntitySystemStep("turn");
    mgr.addStep(step);
    expect(step).toHaveLength(0);

    mgr.addSystem("turn", new TestEntitySystem("b"));
    expect(step).toHaveLength(1);

    expect(() => mgr.addSystem("turn", new TestSystem("a"))).not.toThrow();
    mgr.addSystem(new TestSystem("c")); // update step
    expect(step).toHaveLength(2); // entity system + regular system

    mgr.addStep(new EntitySystemStep("calc")); // add another
  });

  test("add entity set", () => {
    const mgr = new SystemManager();
    const set = new EntitySystemSet("turn", ["a", "b", "c"]);
    mgr.addSet(set);
    expect(set.steps).toHaveLength(3);
    mgr.addStep("turn", "d");
    expect(set.steps).toHaveLength(4);

    expect(set.getStep("d")).toHaveLength(0);
    mgr.addSystem("turn", "d", new TestEntitySystem("d"));
    expect(set.getStep("d")).toHaveLength(1);
    expect(() => mgr.addSystem("turn", "d", new TestSystem("d"))).not.toThrow();
  });
});
