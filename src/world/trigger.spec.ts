import "jest-extended";
import * as Event from "./trigger";
import { World } from "./world";

describe("events", () => {
  class TestEvent {
    constructor() {}
  }

  class TestSubEvent extends TestEvent {
    constructor() {
      super();
    }
  }

  class TestHandler extends Event.TriggerHandler<TestEvent> {
    cb: jest.Func;
    id: string;

    constructor(id: string, cb: jest.Func) {
      super();
      this.cb = cb;
      this.id = id;
    }

    runTrigger(world: World, event: TestEvent, time: number): boolean {
      return this.cb(this.id, event) === true;
    }
  }

  describe("handler step", () => {
    test("step.constructor(name)", () => {
      const step = new Event.HandlerStep("test");
      expect(step.name).toEqual("test");
      expect(step.length).toEqual(0);
    });

    test("step.addHandler(handler)", () => {
      const step = new Event.HandlerStep("test");
      const cb = jest.fn();
      step.addHandler(new TestHandler("1", cb));
      expect(step.length).toEqual(1);
      expect(step._handlers).toHaveLength(1);

      const world = new World();
      const ev = new TestEvent();
      step.emit(world, ev, 0);
      expect(cb).toHaveBeenCalledWith("1", ev);
    });

    test("step.addHandler(handler,order)", () => {
      const step = new Event.HandlerStep("test");
      const cb = jest.fn();
      step.addHandler(new TestHandler("1", cb), "post");
      step.addHandler(new TestHandler("2", cb), "pre");
      step.addHandler(new TestHandler("3", cb), "normal");
      expect(step.length).toEqual(3);

      const world = new World();
      const ev = new TestEvent();
      step.emit(world, ev, 0);
      expect(cb).toHaveBeenCalledWith("2", ev);
      expect(cb).toHaveBeenCalledWith("3", ev);
      expect(cb).toHaveBeenCalledWith("1", ev);
    });

    test("step.addHandler(handler,false) - not enabled", () => {
      const step = new Event.HandlerStep("test");
      const cb = jest.fn();
      const handler = new TestHandler("1", cb);
      expect(handler.enabled).toBeTrue();
      step.addHandler(handler, false);
      expect(handler.enabled).toBeFalse();

      const world = new World();
      const ev = new TestEvent();
      step.emit(world, ev, 0);
      expect(cb).not.toHaveBeenCalled();
    });

    // TODO - Re-entry (emit causes emit)
  });

  describe("handler Set", () => {
    test("set.constructor(cls)", () => {
      const world = new World();
      const set = new Event.HandlerSet(TestEvent);
      const cb = jest.fn();
      const handler = new TestHandler("a", cb);
      set.addHandler(handler);
      const event = new TestEvent();
      set.emit(world, event, 0);
      expect(cb).toHaveBeenCalledWith("a", event);
    });

    test("set.addHandler x3", () => {
      const world = new World();
      const set = new Event.HandlerSet(TestEvent);
      const cb = jest.fn();
      const handler = new TestHandler("a", cb);
      set.addHandler(handler);
      set.addHandler(handler);
      set.addHandler(handler);
      const event = new TestEvent();
      set.emit(world, event, 0);
      expect(cb).toHaveBeenCalledTimes(3);
    });

    test("stopPropagation", () => {
      const world = new World();
      const set = new Event.HandlerSet(TestEvent);

      const cb = jest.fn();
      const handler = new TestHandler("a", cb);
      set.addHandler(handler);
      set.addHandler(handler);

      const cb2 = jest.fn().mockReturnValue(true);
      const handler2 = new TestHandler("a", cb2);
      set.addHandler(handler2);

      set.addHandler(handler);
      set.addHandler(handler);

      const event = new TestEvent();
      set.emit(world, event, 0);
      expect(cb).toHaveBeenCalledTimes(2);
    });

    test("set.constructor(cls, [step, step, step])", () => {
      const world = new World();
      const set = new Event.HandlerSet(TestEvent, ["a", "b", "c"]);
      const cb = jest.fn();

      const handlerB = new TestHandler("b", cb);
      set.addHandler("b", handlerB);
      const handlerC = new TestHandler("c", cb);
      set.addHandler("c", handlerC);
      const handlerA = new TestHandler("a", cb);
      set.addHandler(handlerA); // default to step[0]

      const event = new TestEvent();
      set.emit(world, event, 0);
      expect(cb).toHaveBeenNthCalledWith(1, "a", event);
      expect(cb).toHaveBeenNthCalledWith(2, "b", event);
      expect(cb).toHaveBeenNthCalledWith(3, "c", event);
    });

    test("set.addStep(step, opts)", () => {
      const world = new World();
      const set = new Event.HandlerSet(TestEvent, ["a"]);
      const cb = jest.fn();
      set.addStep("c", { after: "a" });
      set.addStep("b", { before: "c" });

      const handlerB = new TestHandler("b", cb);
      set.addHandler("b", handlerB);
      const handlerC = new TestHandler("c", cb);
      set.addHandler("c", handlerC);
      const handlerA = new TestHandler("a", cb);
      set.addHandler(handlerA); // default to step[0]

      const event = new TestEvent();
      set.emit(world, event, 0);
      expect(cb).toHaveBeenNthCalledWith(1, "a", event);
      expect(cb).toHaveBeenNthCalledWith(2, "b", event);
      expect(cb).toHaveBeenNthCalledWith(3, "c", event);
    });

    test("set.getStep(step)", () => {
      const set = new Event.HandlerSet(TestEvent, ["a", "b", "c"]);
      expect(set.getStep("a")).toEqual(
        expect.any(Event.HandlerStep<TestEvent>)
      );
      expect(set.getStep("b")).toEqual(
        expect.any(Event.HandlerStep<TestEvent>)
      );
      expect(set.getStep("c")).toEqual(
        expect.any(Event.HandlerStep<TestEvent>)
      );
      expect(set.getStep("test")).toBeUndefined();
    });

    test.todo("re-entry (emit causes emit)");
  });

  describe("event manager", () => {
    test("manager.register(cls)", () => {
      const manager = new Event.TriggerManager();
      expect(manager.getSet(TestEvent)).toBeUndefined();
      manager.register(TestEvent);
      expect(manager.getSet(TestEvent)).toEqual(expect.any(Event.HandlerSet));
    });

    test("manager.register(cls, [step, step, step])", () => {
      const manager = new Event.TriggerManager();
      manager.register(TestEvent, ["a", "b", "c"]);
      const set = manager.getSet(TestEvent)!;
      expect(set).toEqual(expect.any(Event.HandlerSet));
      expect(set).toHaveLength(3);
      expect(set.getStep("a")).toEqual(expect.any(Event.HandlerStep));
      expect(set.getStep("b")).toEqual(expect.any(Event.HandlerStep));
      expect(set.getStep("c")).toEqual(expect.any(Event.HandlerStep));
      expect(set.getStep("test")).toBeUndefined();
    });

    test("manager.getSet(cls) - subclass", () => {
      const manager = new Event.TriggerManager();
      manager.register(TestEvent, ["a", "b", "c"]);
      const set = manager.getSet(TestEvent)!;
      expect(set).toEqual(expect.any(Event.HandlerSet));
      expect(manager.getSet(TestSubEvent)).toBe(set);

      manager.register(TestSubEvent);
      expect(manager.getSet(TestSubEvent)).not.toBe(set);
    });

    test("manager.addStep(cls, step, opts)", () => {
      const manager = new Event.TriggerManager();
      manager.register(TestEvent, ["a"]);
      manager.addStep(TestEvent, "c");
      manager.addStep(TestEvent, "b", { before: "c" });

      const cb = jest.fn();
      manager.addHandler(TestEvent, "b", new TestHandler("b", cb));
      manager.addHandler(TestEvent, "c", new TestHandler("c", cb));
      manager.addHandler(TestEvent, new TestHandler("a", cb)); // default to step[0]

      const world = new World();
      const event = new TestEvent();
      manager.emit(world, event, 0);
      expect(cb).toHaveBeenNthCalledWith(1, "a", event);
      expect(cb).toHaveBeenNthCalledWith(2, "b", event);
      expect(cb).toHaveBeenNthCalledWith(3, "c", event);
    });

    test("manager.getStep(cls, step)", () => {
      const manager = new Event.TriggerManager();
      manager.register(TestEvent, ["a", "b", "c"]);
      const step = manager.getStep(TestEvent, "b")!;
      expect(step).toEqual(expect.any(Event.HandlerStep));
      expect(manager.getStep(TestEvent, "test")).toBeUndefined();
    });

    test.todo("re-entry (emit causes emit)");
  });

  describe("world events", () => {
    test("world.registerTrigger(cls)", () => {
      const world = new World();
      const cb = jest.fn();

      world.registerTrigger(TestEvent);
      world.addTrigger(TestEvent, cb);
      world.emitTrigger(new TestEvent());

      expect(cb).toHaveBeenCalledWith(world, expect.any(TestEvent), 0);
    });

    test("world.registerTrigger(cls, [step, step, step])", () => {
      const world = new World();
      const cb = jest.fn();

      world.registerTrigger(TestEvent, ["a", "b", "c"]);
      world.addTrigger(TestEvent, "b", cb);
      world.emitTrigger(new TestEvent());

      expect(cb).toHaveBeenCalledWith(world, expect.any(TestEvent), 0);
    });

    test("world.addTriggerStep(cls, step, opts)", () => {
      const world = new World();
      const cb = jest.fn();

      world.registerTrigger(TestEvent, ["a"]);
      world.addTriggerStep(TestEvent, "b");
      world.addTrigger(TestEvent, "b", cb);
      world.emitTrigger(new TestEvent());

      expect(cb).toHaveBeenCalledWith(world, expect.any(TestEvent), 0);
    });

    test.todo("world.delay.emitTrigger(item)");
  });
});
