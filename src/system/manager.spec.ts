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
      const set = new SystemSet("test");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem(a);
      set.addSystem(b, "update");
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
      const set = new SystemSet("test");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem(a, "update");
      set.addSystem(b, "post-update");
      set.addSystem(c, "pre-update");

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
      const set = new EntitySystemSet("test");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem(a);
      set.addSystem(b, "update");
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
      const set = new EntitySystemSet("test");
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      set.addSystem(a, "update");
      set.addSystem(b, "post-update");
      set.addSystem(c, "pre-update");

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

      manager.addSystem(new TestSystem("a"), "pre-finish");
      manager.addSystem(new TestSystem("b"), "update");
      manager.addSystem(new TestSystem("c"), "post-start");

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

      manager.addSystem(new TestSystem("a"), "panic", "post-finish");
      manager.addSystem(new TestSystem("b"), "panic", "pre-update");
      manager.addSystem(new TestSystem("c"), "panic", "start");

      const world = new World().setUnique(new RunOrder());
      manager.start(world);
      manager.runSet("panic", world, 0, 0);

      expect(world.getUnique(RunOrder).get()).toEqual(["c", "b", "a"]);
    });

    test("add set with steps", () => {
      const manager = new SystemManager();

      manager.addSet("panic", ["start", "update", "finish"]);

      manager.addSystem(new TestSystem("a"), "panic", "post-finish");
      manager.addSystem(new TestSystem("b"), "panic", "update");
      manager.addSystem(new TestSystem("c"), "panic", "pre-start");

      const world = new World().setUnique(new RunOrder());
      manager.start(world);
      manager.runSet("panic", world, 0, 0);

      expect(world.getUnique(RunOrder).get()).toEqual(["c", "b", "a"]);
    });
  });
});
