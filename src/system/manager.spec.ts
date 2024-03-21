import "jest-extended";
import { System } from "./system.js";
import {
  EntitySystemSet,
  EntitySystemStep,
  SystemManager,
  SystemSet,
  SystemStep,
} from "./manager.js";
import { World } from "../world/world.js";
import { EntitySystem } from "./entitySystem.js";
import { Aspect } from "../world/aspect.js";

describe("manager", () => {
  describe("SystemStep", () => {
    test("add a system", () => {
      const step = new SystemStep("update");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      step.addSystem(a);
      step.addSystem(b, "normal");
      step.addSystem(c);

      expect(step.name).toEqual("update");
      let all: [System, string][] = [];
      step.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "update"],
        [expect.objectContaining({ _fn: c }), "update"],
      ]);
    });
    test('add "pre-" + "post-" systems', () => {
      const step = new SystemStep("update");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      step.addSystem(a, "normal");
      step.addSystem(b, "post");
      step.addSystem(c, "pre");

      expect(step.name).toEqual("update");
      let all: [System, string][] = [];
      step.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: c }), "pre-update"],
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "post-update"],
      ]);
    });

    test.todo("add a system before another system");
    test.todo("add a system after another system");
  });

  describe("EntitySystemStep", () => {
    test("add a system", () => {
      const step = new EntitySystemStep("update");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      step.addSystem(a);
      step.addSystem(b, "normal");
      step.addSystem(c);

      expect(step.name).toEqual("update");
      let all: [System, string][] = [];
      step.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "update"],
        [expect.objectContaining({ _fn: c }), "update"],
      ]);
    });
    test('add "pre-" + "post-" systems', () => {
      const step = new EntitySystemStep("update");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      step.addSystem(a, "normal");
      step.addSystem(b, "post");
      step.addSystem(c, "pre");

      expect(step.name).toEqual("update");
      let all: [System, string][] = [];
      step.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: c }), "pre-update"],
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "post-update"],
      ]);
    });
    test.todo("add a system before another system");
    test.todo("add a system after another system");
  });

  describe("SystemSet", () => {
    test("add a system", () => {
      const set = new SystemSet();
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem(a);
      set.addSystem("update", b);
      set.addSystem(c);

      expect(set.steps[0].name).toEqual("update");
      let all: [System, string][] = [];
      set.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "update"],
        [expect.objectContaining({ _fn: c }), "update"],
      ]);
    });
    test('add "pre-" + "post-" systems', () => {
      const set = new SystemSet();
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem("update", a);
      set.addSystem("post-update", b);
      set.addSystem("pre-update", c);

      expect(set.steps[0].name).toEqual("update");
      let all: [System, string][] = [];
      set.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: c }), "pre-update"],
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "post-update"],
      ]);
    });

    test.todo("add a system before another system");
    test.todo("add a system after another system");
  });

  describe("EntitySystemSet", () => {
    test("add a system", () => {
      const set = new EntitySystemSet();
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem(a);
      set.addSystem("update", b);
      set.addSystem(c);

      expect(set.steps[0].name).toEqual("update");
      let all: [System, string][] = [];
      set.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "update"],
        [expect.objectContaining({ _fn: c }), "update"],
      ]);
    });
    test('add "pre-" + "post-" systems', () => {
      const set = new EntitySystemSet();
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem("update", a);
      set.addSystem("post-update", b);
      set.addSystem("pre-update", c);

      expect(set.steps[0].name).toEqual("update");
      let all: [System, string][] = [];
      set.forEach((sys, step) => all.push([sys, step]));
      expect(all).toEqual([
        [expect.objectContaining({ _fn: c }), "pre-update"],
        [expect.objectContaining({ _fn: a }), "update"],
        [expect.objectContaining({ _fn: b }), "post-update"],
      ]);
    });

    test.todo("add a system before another system");
    test.todo("add a system after another system");
  });

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

      manager.addSystem("pre-finish", new TestSystem("a"));
      manager.addSystem("update", new TestSystem("b"));
      manager.addSystem("post-start", new TestSystem("c"));

      const defaultSet = manager.getSet()!;
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
      const step = new EntitySystemStep();
      mgr.addStep("turn", { step });
      expect(step.systems).toHaveLength(0);
      mgr.addSystem("turn", new TestEntitySystem("b"));
      expect(step.systems).toHaveLength(1);

      expect(() => mgr.addSystem("turn", new TestSystem("a"))).toThrow(
        "Must be EntitySystem"
      );
      mgr.addSystem(new TestSystem("c")); // update step
      expect(step.systems).toHaveLength(1); // not added to this step

      mgr.addStep("calc", new EntitySystemStep()); // add another
    });

    test("add entity set", () => {
      const mgr = new SystemManager();
      const set = new EntitySystemSet(["a", "b", "c"]);
      mgr.addSet("turn", set);
      expect(set.steps).toHaveLength(3);
      mgr.addStep("turn", "d");
      expect(set.steps).toHaveLength(4);

      expect(set.getStep("d")).toHaveLength(0);
      mgr.addSystem("turn", "d", new TestEntitySystem("d"));
      expect(set.getStep("d")).toHaveLength(1);
      expect(() => mgr.addSystem("turn", "d", new TestSystem("d"))).toThrow(
        "Must be EntitySystem"
      );
    });
  });
});
