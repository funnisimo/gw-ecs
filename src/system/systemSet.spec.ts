import "jest-extended";
import { System } from "./system";
import { Level, World } from "../world";
import { EntitySystem } from "./entitySystem";
import { Entity } from "../entity";
import { SystemSet, EntitySystemSet } from "./systemSet";
import { EntitySystemStep, SystemStep } from "./systemStep";

class TestSystem extends System {
  cb: jest.Func;
  id: number;

  constructor(cb: jest.Func, id: number) {
    super();
    this.cb = cb;
    this.id = id;
  }

  run(_level: Level, _time: number, _delta: number): void {
    this.cb(this.id);
  }
}

// @ts-ignore
class TestEntitySystem extends EntitySystem {
  cb: jest.Func;
  id: number;

  constructor(cb: jest.Func, id: number) {
    super();
    this.cb = cb;
    this.id = id;
  }

  runEntity(
    _level: Level,
    entity: Entity,
    _time: number,
    _delta: number
  ): void {
    this.cb(this.id, entity);
  }
}

describe("SystemSet", () => {
  test("default", () => {
    const set = new SystemSet("name");
    expect(set.name).toEqual("name");
    expect(set.length).toEqual(1);
    expect(set.getStep("update")).toBeInstanceOf(SystemStep);
  });

  test("empty", () => {
    const set = new SystemSet("name", []);
    expect(set.name).toEqual("name");
    expect(set.length).toEqual(0);
    expect(set.getStep("update")).toBeUndefined();
  });

  test("create with steps", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.name).toEqual("name");
    expect(set.length).toEqual(3);
    expect(set.getStep("update")).toBeUndefined();
    expect(set.getStep("a")).toBeInstanceOf(SystemStep);
    expect(set.getStep("b")).toBeInstanceOf(SystemStep);
    expect(set.getStep("c")).toBeInstanceOf(SystemStep);
  });

  test("addStep - push", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep("d");
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c", "d"]);
  });

  test("addStep - duplicate", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    expect(() => set.addStep("a")).toThrow();
    expect(() => set.addStep(new SystemStep("a"))).toThrow();
    expect(() => set.addStep(new EntitySystemStep("a"))).toThrow();
  });

  test("addStep - before", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep("d", { before: "a" });
    expect(set.steps.map((s) => s.name)).toEqual(["d", "a", "b", "c"]);

    set.addStep("e", { before: "c" });
    expect(set.steps.map((s) => s.name)).toEqual(["d", "a", "b", "e", "c"]);
  });

  test("addStep - before missing", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    expect(() => set.addStep("d", { before: "f" })).toThrow();
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
  });

  test("addStep - after", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep("d", { after: "a" });
    expect(set.steps.map((s) => s.name)).toEqual(["a", "d", "b", "c"]);

    set.addStep("e", { after: "c" });
    expect(set.steps.map((s) => s.name)).toEqual(["a", "d", "b", "c", "e"]);
  });

  test("addStep - after missing", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    expect(() => set.addStep("d", { after: "f" })).toThrow();
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
  });

  test("addSystem - default step", () => {
    const world = new World();
    const cb = jest.fn();
    const set = new SystemSet("name");

    set.addSystem(new TestSystem(cb, 3)); // 'update' step

    set.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, 3);
  });

  test("addSystem - with step", () => {
    const world = new World();
    const cb = jest.fn();
    const set = new SystemSet("name", ["a", "b", "c"]);

    set.addSystem("c", new TestSystem(cb, 3));
    set.addSystem("a", new TestSystem(cb, 1));
    set.addSystem("b", new TestSystem(cb, 2));

    set.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, 1);
    expect(cb).toHaveBeenNthCalledWith(2, 2);
    expect(cb).toHaveBeenNthCalledWith(3, 3);
  });
  test("addSystem - missing step", () => {
    const cb = jest.fn();
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(() => set.addSystem(new TestSystem(cb, 2))).toThrow(); // No 'update' step
    expect(() => set.addSystem("d", new TestSystem(cb, 2))).toThrow(); // No 'd' step
  });

  test("addSystem - fn", () => {
    const world = new World();
    const cb = jest.fn();
    const set = new SystemSet("name");

    set.addSystem(cb); // 'update' step
    set.addSystem("update", cb);

    set.run(world, 0, 0);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  test("addSystem - entity system", () => {
    const world = new World();
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    const set = new SystemSet("name", ["a", "b", "c"]);

    set.addSystem("c", new TestSystem(cb, 3));
    set.addSystem("a", new TestEntitySystem(cb, 1));
    set.addSystem("b", new TestSystem(cb, 2));

    set.run(world, 0, 0);
    // entity systems run each entity
    expect(cb).toHaveBeenNthCalledWith(1, 1, entity);
    expect(cb).toHaveBeenNthCalledWith(2, 1, entity2);
    // the other systems just run
    expect(cb).toHaveBeenNthCalledWith(3, 2);
    expect(cb).toHaveBeenNthCalledWith(4, 3);
  });

  test("addStep - entity step", () => {
    const set = new SystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep(new EntitySystemStep("d"));
    expect(set.getStep("d")).toBeInstanceOf(EntitySystemStep);

    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c", "d"]);
    set.addStep(new EntitySystemStep("e"), { before: "a" });
    expect(set.getStep("e")).toBeInstanceOf(EntitySystemStep);

    expect(set.steps.map((s) => s.name)).toEqual(["e", "a", "b", "c", "d"]);
    set.addStep(new EntitySystemStep("f"), { after: "d" });
    expect(set.getStep("f")).toBeInstanceOf(EntitySystemStep);

    expect(set.steps.map((s) => s.name)).toEqual([
      "e",
      "a",
      "b",
      "c",
      "d",
      "f",
    ]);

    set.addStep("g");

    const world = new World();
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    set.addSystem("d", new TestEntitySystem(cb, 1)); // in entity step
    set.addSystem("d", new TestEntitySystem(cb, 2)); // in entity step
    set.addSystem("a", new TestEntitySystem(cb, 3)); // in normal step
    set.addSystem("a", new TestEntitySystem(cb, 4)); // in normal step
    set.addSystem("g", new TestEntitySystem(cb, 5)); // in normal step
    set.addSystem("g", new TestEntitySystem(cb, 6)); // in normal step

    set.run(world, 0, 0);
    // call a - runs each system in order
    expect(cb).toHaveBeenNthCalledWith(1, 3, entity);
    expect(cb).toHaveBeenNthCalledWith(2, 3, entity2);
    expect(cb).toHaveBeenNthCalledWith(3, 4, entity);
    expect(cb).toHaveBeenNthCalledWith(4, 4, entity2);
    // call d - runs each entity in order
    expect(cb).toHaveBeenNthCalledWith(5, 1, entity);
    expect(cb).toHaveBeenNthCalledWith(6, 2, entity);
    expect(cb).toHaveBeenNthCalledWith(7, 1, entity2);
    expect(cb).toHaveBeenNthCalledWith(8, 2, entity2);
    // call g - runs each system in order
    expect(cb).toHaveBeenNthCalledWith(9, 5, entity);
    expect(cb).toHaveBeenNthCalledWith(10, 5, entity2);
    expect(cb).toHaveBeenNthCalledWith(11, 6, entity);
    expect(cb).toHaveBeenNthCalledWith(12, 6, entity2);
  });
});

describe("EntitySystemSet", () => {
  test("default", () => {
    const set = new EntitySystemSet("name");
    expect(set.name).toEqual("name");
    expect(set.length).toEqual(1);
    expect(set.getStep("update")).toBeInstanceOf(EntitySystemStep);
  });

  test("empty", () => {
    const set = new EntitySystemSet("name", []);
    expect(set.name).toEqual("name");
    expect(set.length).toEqual(0);
    expect(set.getStep("update")).toBeUndefined();
  });

  test("create with steps", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.name).toEqual("name");
    expect(set.length).toEqual(3);
    expect(set.getStep("update")).toBeUndefined();
    expect(set.getStep("a")).toBeInstanceOf(EntitySystemStep);
    expect(set.getStep("b")).toBeInstanceOf(EntitySystemStep);
    expect(set.getStep("c")).toBeInstanceOf(EntitySystemStep);
  });

  test("addStep - push", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep("d");
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c", "d"]);
  });

  test("addStep - duplicate", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    expect(() => set.addStep("a")).toThrow();
    expect(() => set.addStep(new EntitySystemStep("a"))).toThrow();
  });

  test("addStep - before", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep("d", { before: "a" });
    expect(set.steps.map((s) => s.name)).toEqual(["d", "a", "b", "c"]);

    set.addStep("e", { before: "c" });
    expect(set.steps.map((s) => s.name)).toEqual(["d", "a", "b", "e", "c"]);
  });

  test("addStep - before missing", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    expect(() => set.addStep("d", { before: "f" })).toThrow();
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
  });

  test("addStep - after", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    set.addStep("d", { after: "a" });
    expect(set.steps.map((s) => s.name)).toEqual(["a", "d", "b", "c"]);

    set.addStep("e", { after: "c" });
    expect(set.steps.map((s) => s.name)).toEqual(["a", "d", "b", "c", "e"]);
  });

  test("addStep - after missing", () => {
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
    expect(() => set.addStep("d", { after: "f" })).toThrow();
    expect(set.steps.map((s) => s.name)).toEqual(["a", "b", "c"]);
  });

  test("addSystem - default step", () => {
    const world = new World();
    const entity = world.create();

    const cb = jest.fn();
    const set = new EntitySystemSet("name");

    set.addSystem(new TestEntitySystem(cb, 3)); // 'update' step

    set.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, 3, entity);
  });

  test("addSystem - with step", () => {
    const world = new World();
    const entity = world.create();

    const cb = jest.fn();
    const set = new EntitySystemSet("name", ["a", "b", "c"]);

    set.addSystem("c", new TestEntitySystem(cb, 3));
    set.addSystem("a", new TestEntitySystem(cb, 1));
    set.addSystem("b", new TestEntitySystem(cb, 2));

    set.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, 1, entity);
    expect(cb).toHaveBeenNthCalledWith(2, 2, entity);
    expect(cb).toHaveBeenNthCalledWith(3, 3, entity);
  });

  test("addSystem - missing step", () => {
    const cb = jest.fn();
    const set = new EntitySystemSet("name", ["a", "b", "c"]);
    expect(() => set.addSystem(new TestEntitySystem(cb, 2))).toThrow(); // No 'update' step
    expect(() => set.addSystem("d", new TestEntitySystem(cb, 2))).toThrow(); // No 'd' step
  });

  test("addSystem - fn", () => {
    const world = new World();
    const cb = jest.fn();
    const set = new EntitySystemSet("name");

    set.addSystem(cb); // 'update' step
    set.addSystem("update", cb);

    set.run(world, 0, 0);
    expect(cb).toHaveBeenCalledTimes(0); // no entities

    world.create();
    set.run(world, 0, 0);
    expect(cb).toHaveBeenCalledTimes(2); // 1 entity * 2 systems
  });
});
