import "jest-extended";
import { FunctionSystem, System } from "./system";
import { Queue, World } from "../world";
import { EntityFunctionSystem, EntitySystem } from "./entitySystem";
import { EntitySystemStep, QueueSystemStep, SystemStep } from "./systemStep";
import { Entity } from "../entity";
import { QueueSystem } from "./queueSystem";

class A {}
class B {}

class TestSystem extends System {
  cb: jest.Func;
  id: number;

  constructor(cb: jest.Func, id: number) {
    super();
    this.cb = cb;
    this.id = id;
  }

  run(_world: World, _time: number, _delta: number): void {
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
    _world: World,
    entity: Entity,
    _time: number,
    _delta: number
  ): void {
    this.cb(this.id, entity);
  }
}

class TestQueueSystem<T> extends QueueSystem<T> {
  cb: jest.Func;
  id: number;

  constructor(cb: jest.Func, id: number, comp: Queue<T>) {
    super(comp);
    this.cb = cb;
    this.id = id;
  }

  runQueueItem(_world: World, item: T, _time: number, _delta: number): void {
    this.cb(this.id, item);
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

  test("add system with queue system", () => {
    const world = new World().registerQueue(A);
    const cb = jest.fn();
    const step = new SystemStep("update");

    step.addSystem(new TestQueueSystem<A>(cb, 2, A));
    expect(step).toHaveLength(1);

    step.addSystem(new TestQueueSystem<A>(cb, 3, A), "post");
    expect(step).toHaveLength(2);

    step.addSystem(new TestQueueSystem<A>(cb, 1, A), "pre");
    expect(step).toHaveLength(3);

    step.start(world);

    const a1 = world.pushQueue(new A());
    const a2 = world.pushQueue(new A());

    step.run(world, 0, 0);
    // Process first system completely
    expect(cb).toHaveBeenNthCalledWith(1, 1, a1);
    expect(cb).toHaveBeenNthCalledWith(2, 1, a2);
    // Process next system completely
    expect(cb).toHaveBeenNthCalledWith(3, 2, a1);
    expect(cb).toHaveBeenNthCalledWith(4, 2, a2);
    // then the last
    expect(cb).toHaveBeenNthCalledWith(5, 3, a1);
    expect(cb).toHaveBeenNthCalledWith(6, 3, a2);
  });

  test("add fn system", () => {
    const world = new World();

    const cb = jest.fn();
    const step = new SystemStep("update");

    step.addSystem(cb); // normal is default
    expect(step.length).toEqual(1);

    step.run(world, 0, 0);
    expect(cb).toHaveBeenCalledWith(world, 0, 0);
  });

  test("forEach", () => {
    const step = new SystemStep("update");
    const a = jest.fn();
    const b = jest.fn();
    const c = jest.fn();

    const sysA = new FunctionSystem(a);
    step.addSystem(sysA, "normal");
    const sysB = new FunctionSystem(b);
    step.addSystem(sysB);
    const sysC = new FunctionSystem(c);
    step.addSystem(sysC);

    expect(step.name).toEqual("update");
    let all: [System, string][] = [];
    step.forEach((sys, step) => all.push([sys, step]));
    expect(all).toEqual([
      [sysA, "update"],
      [sysB, "update"],
      [sysC, "update"],
    ]);
  });
  test('forEach with "pre-" + "post-" systems', () => {
    const step = new SystemStep("update");
    const a = jest.fn();
    const b = jest.fn();
    const c = jest.fn();

    const sysA = new FunctionSystem(a);
    step.addSystem(sysA, "normal");
    const sysB = new FunctionSystem(b);
    step.addSystem(sysB, "post");
    const sysC = new FunctionSystem(c);
    step.addSystem(sysC, "pre");

    expect(step.name).toEqual("update");
    let all: [System, string][] = [];
    step.forEach((sys, step) => all.push([sys, step]));
    expect(all).toEqual([
      [sysC, "pre-update"],
      [sysA, "update"],
      [sysB, "post-update"],
    ]);
  });
});

describe("EntitySystemStep", () => {
  test("default empty", () => {
    const step = new EntitySystemStep("update");
    expect(step.name).toEqual("update");
    expect(step.length).toEqual(0);
  });

  test("addSystem - entity systems", () => {
    const world = new World();
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    const step = new EntitySystemStep("update");

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

  test("addSystem - other systems", () => {
    const world = new World().registerQueue(A);
    const entity = world.create();
    const entity2 = world.create();

    const cb = jest.fn();
    const step = new EntitySystemStep("update");

    const entityCb = jest.fn().mockImplementation((id, e) => {
      cb(id, e);
      world.pushQueue(new A());
    });
    step.addSystem(new TestEntitySystem(entityCb, 2)); // Must be EntitySystem
    expect(step.length).toEqual(1);

    step.addSystem(new TestQueueSystem(cb, 3, A), "post");
    expect(step.length).toEqual(2);

    step.addSystem(new TestSystem(cb, 1), "pre");
    expect(step.length).toEqual(3);

    expect(step._preSystems).toHaveLength(1);
    expect(step._systems).toHaveLength(1);
    expect(step._postSystems).toHaveLength(1);

    step.start(world);

    step.run(world, 0, 0);
    // Processes each entity through all systems...
    expect(cb).toHaveBeenNthCalledWith(1, 1);
    expect(cb).toHaveBeenNthCalledWith(2, 2, entity);
    expect(cb).toHaveBeenNthCalledWith(3, 3, expect.any(A));
    // Then goes onto the next entity.
    expect(cb).toHaveBeenNthCalledWith(4, 1);
    expect(cb).toHaveBeenNthCalledWith(5, 2, entity2);
    expect(cb).toHaveBeenNthCalledWith(6, 3, expect.any(A));
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

  test("forEach", () => {
    const step = new EntitySystemStep("update");
    const a = jest.fn();
    const b = jest.fn();
    const c = jest.fn();

    const sysA = new EntityFunctionSystem(a);
    step.addSystem(sysA);
    const sysB = new EntityFunctionSystem(b);
    step.addSystem(sysB);
    const sysC = new EntityFunctionSystem(c);
    step.addSystem(sysC);

    expect(step.name).toEqual("update");
    let all: [System, string][] = [];
    step.forEach((sys, step) => all.push([sys, step]));
    expect(all).toEqual([
      [sysA, "update"],
      [sysB, "update"],
      [sysC, "update"],
    ]);
  });

  test('forEach with "pre-" + "post-" systems', () => {
    const step = new EntitySystemStep("update");
    const a = jest.fn();
    const b = jest.fn();
    const c = jest.fn();

    const sysA = new EntityFunctionSystem(a);
    step.addSystem(sysA, "normal");
    const sysB = new EntityFunctionSystem(b);
    step.addSystem(sysB, "post");
    const sysC = new EntityFunctionSystem(c);
    step.addSystem(sysC, "pre");

    expect(step.name).toEqual("update");
    let all: [System, string][] = [];
    step.forEach((sys, step) => all.push([sys, step]));
    expect(all).toEqual([
      [sysC, "pre-update"],
      [sysA, "update"],
      [sysB, "post-update"],
    ]);
  });
});

describe("queueSystemStep", () => {
  test("default empty", () => {
    const step = new QueueSystemStep("update", A);
    expect(step.name).toEqual("update");
    expect(step.length).toEqual(0);
  });

  test("add system", () => {
    const world = new World().registerQueue(A);
    const cb = jest.fn();
    const step = new QueueSystemStep("update", A);

    step.addSystem(new TestQueueSystem<A>(cb, 2, A));
    expect(step).toHaveLength(1);

    step.addSystem(new TestQueueSystem<A>(cb, 3, A), "post");
    expect(step).toHaveLength(2);

    step.addSystem(new TestQueueSystem<A>(cb, 1, A), "pre");
    expect(step).toHaveLength(3);

    step.start(world);

    const a1 = world.pushQueue(new A());
    const a2 = world.pushQueue(new A());

    step.run(world, 0, 0);
    // Process first item completely
    expect(cb).toHaveBeenNthCalledWith(1, 1, a1);
    expect(cb).toHaveBeenNthCalledWith(2, 2, a1);
    expect(cb).toHaveBeenNthCalledWith(3, 3, a1);
    // Process next item completely
    expect(cb).toHaveBeenNthCalledWith(4, 1, a2);
    expect(cb).toHaveBeenNthCalledWith(5, 2, a2);
    expect(cb).toHaveBeenNthCalledWith(6, 3, a2);
  });

  test("add system - not queue system", () => {
    const cb = jest.fn();
    const step = new QueueSystemStep("update", A);
    expect(() => step.addSystem(new TestSystem(cb, 2))).not.toThrow();
    expect(() => step.addSystem(new TestEntitySystem(cb, 2))).not.toThrow();
  });

  test("add system - wrong component", () => {
    const cb = jest.fn();
    const step = new QueueSystemStep("update", A);
    expect(() => step.addSystem(new TestQueueSystem(cb, 1, B))).toThrow(); // wrong component
  });

  test("add fn system", () => {
    const world = new World().registerQueue(A);
    const cb = jest.fn();
    const step = new QueueSystemStep("update", A);

    step.addSystem(cb); // normal is default
    expect(step.length).toEqual(1);

    step.start(world);

    const a1 = world.pushQueue(new A());
    const a2 = world.pushQueue(new A());

    step.run(world, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(1, world, a1, 0, 0);
    expect(cb).toHaveBeenNthCalledWith(2, world, a2, 0, 0);
  });
});
