import "jest-extended";
import { World } from "../world";
import { QueueSystem } from "./queueSystem";

class A {
  id: number;

  constructor(id: number) {
    this.id = id;
  }
}

class TestSystem extends QueueSystem<A> {
  cb: jest.Func;
  id: string;

  constructor(id: string, cb: jest.Func) {
    super(A);
    this.id = id;
    this.cb = cb;
  }

  runQueueItem(world: World, item: A, time: number, delta: number): void {
    this.cb(this.id, item);
  }
}

describe("QueueSystem", () => {
  test("basics", () => {
    const cb = jest.fn();
    const sys = new TestSystem("a", cb);
    const world = new World().registerQueue(A).addSystem(sys).start();

    world.runSystems();
    expect(cb).not.toHaveBeenCalled();

    const a1 = new A(1);
    const a2 = new A(2);

    world.pushQueue(a1);
    world.pushQueue(a2);
    world.runSystems();
    expect(cb).toHaveBeenCalledTimes(2);
    cb.mockClear();

    world.runSystems();
    expect(cb).not.toHaveBeenCalled();
  });

  test("ordering", () => {
    const cb = jest.fn();
    const world = new World()
      .registerQueue(A)
      .addSystem(new TestSystem("a", cb))
      .addSystem(new TestSystem("b", cb))
      .start();

    world.runSystems();
    expect(cb).not.toHaveBeenCalled();

    const a1 = new A(1);
    const a2 = new A(2);

    world.pushQueue(a1);
    world.pushQueue(a2);
    world.runSystems();
    // First system runs all items
    expect(cb).toHaveBeenNthCalledWith(1, "a", a1);
    expect(cb).toHaveBeenNthCalledWith(2, "a", a2);
    // Next system runs all items
    expect(cb).toHaveBeenNthCalledWith(3, "b", a1);
    expect(cb).toHaveBeenNthCalledWith(4, "b", a2);
    cb.mockClear();

    world.runSystems();
    expect(cb).not.toHaveBeenCalled();
  });
});
