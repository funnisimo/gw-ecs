import "jest-extended";
import { System } from "./system";
import { Level, World } from "../world";
import { EntitySystem } from "./entitySystem";
import { EntitySystemStep, SystemStep } from "./systemStep";
import { Entity } from "../entity";

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

describe("SystemStep", () => {
  test("default empty", () => {
    const step = new SystemStep("update");
    expect(step.name).toEqual("update");
    expect(step.length).toEqual(0);
  });
  test("addSystem", () => {
    const world = new World();
    const cb = jest.fn();
    const step = new SystemStep("update");

    step.addSystem(new TestSystem(cb, 2)); // normal is default
    expect(step.length).toEqual(1);

    step.addSystem(new TestSystem(cb, 3), "post");
    expect(step.length).toEqual(2);

    step.addSystem(new TestSystem(cb, 1), "pre");
    expect(step.length).toEqual(3);

    expect(step._preSystems).toHaveLength(1);
    expect(step._systems).toHaveLength(1);
    expect(step._postSystems).toHaveLength(1);

    step.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, 1);
    expect(cb).toHaveBeenNthCalledWith(2, 2);
    expect(cb).toHaveBeenNthCalledWith(3, 3);
  });
  test("addSystem with EntitySystem", () => {
    const world = new World();
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    const step = new SystemStep("update");

    step.addSystem(new TestEntitySystem(cb, 2)); // normal is default
    expect(step.length).toEqual(1);

    step.addSystem(new TestEntitySystem(cb, 3), "post");
    expect(step.length).toEqual(2);

    step.addSystem(new TestEntitySystem(cb, 1), "pre");
    expect(step.length).toEqual(3);

    step.run(world, 0, 0);
    // Processes all entitis through each system...
    expect(cb).toHaveBeenNthCalledWith(1, 1, entity);
    expect(cb).toHaveBeenNthCalledWith(2, 1, entity2);
    // then goes onto the next system...
    expect(cb).toHaveBeenNthCalledWith(3, 2, entity);
    expect(cb).toHaveBeenNthCalledWith(4, 2, entity2);
    // and so on...
    expect(cb).toHaveBeenNthCalledWith(5, 3, entity);
    expect(cb).toHaveBeenNthCalledWith(6, 3, entity2);
  });

  test.todo("add system with queue system");

  test("add fn system", () => {
    const world = new World();

    const cb = jest.fn();
    const step = new SystemStep("update");

    step.addSystem(cb); // normal is default
    expect(step.length).toEqual(1);

    step.run(world, 0, 0);
    expect(cb).toHaveBeenCalledWith(world, 0, 0);
  });

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
  test("default empty", () => {
    const step = new EntitySystemStep("update");
    expect(step.name).toEqual("update");
    expect(step.length).toEqual(0);
  });
  test("addSystem", () => {
    const world = new World();
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    const step = new EntitySystemStep("update");
    // @ts-ignore
    expect(() => step.addSystem(new TestSystem(cb, 2))).toThrow(); // Must be EntitySystem

    step.addSystem(new TestEntitySystem(cb, 2)); // Must be EntitySystem
    expect(step.length).toEqual(1);

    step.addSystem(new TestEntitySystem(cb, 3), "post");
    expect(step.length).toEqual(2);

    step.addSystem(new TestEntitySystem(cb, 1), "pre");
    expect(step.length).toEqual(3);

    expect(step._preSystems).toHaveLength(1);
    expect(step._systems).toHaveLength(1);
    expect(step._postSystems).toHaveLength(1);

    step.run(world, 0, 0);
    // Processes each entity through all systems...
    expect(cb).toHaveBeenNthCalledWith(1, 1, entity);
    expect(cb).toHaveBeenNthCalledWith(2, 2, entity);
    expect(cb).toHaveBeenNthCalledWith(3, 3, entity);
    // Then goes onto the next entity.
    expect(cb).toHaveBeenNthCalledWith(4, 1, entity2);
    expect(cb).toHaveBeenNthCalledWith(5, 2, entity2);
    expect(cb).toHaveBeenNthCalledWith(6, 3, entity2);
  });
  test("add fn system", () => {
    const world = new World();
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    const step = new EntitySystemStep("update");

    step.addSystem(cb); // normal is default
    expect(step.length).toEqual(1);

    step.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, world, entity, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(2, world, entity2, 0, 0);
  });

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

describe("queueSystemStep", () => {
  test.todo("create");
  test.todo("add system");
  test.todo("add system - not queue system");
  test.todo("add fn system");
});
