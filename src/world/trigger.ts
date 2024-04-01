import { Component } from "../component";
import { AddStepOpts, SystemOrder } from "../system";
import { World } from "./world";

// TODO - Should trigger handlers be middleware?
//      - runTrigger(world, event, time, next)
//      - Writing handlers is a little more complicated, but not much - call next()
//      - ordering is a little more confusing - last == first, but do work after next() call

// TODO - re-entry?
//      - should subsequent triggers be queued?
//      - infinite loop prevention?

// TODO - subclasses work as base class
//      - MySubEvent extends AnotherEvent

export type TriggerCls<T> = Component<T>;
export type AnyTriggerCls = TriggerCls<any>;

export type HandleIfFn = (
  world: World,
  time: number,
  lastTick: number
) => boolean;

export class TriggerHandler<T> {
  lastTick: number = 0;
  enabled: boolean = true;
  _runIf: HandleIfFn;

  constructor(runIf?: HandleIfFn) {
    this._runIf = runIf || (() => true);
  }

  runIf(fn: HandleIfFn): this {
    this._runIf = fn;
    return this;
  }

  setEnabled(enabled = true) {
    this.enabled = enabled;
  }

  shouldRun(world: World, time: number): boolean {
    return this.enabled && this._runIf(world, time, this.lastTick);
  }

  start(world: World) {}

  // return true to stop trigger propagation
  runTrigger(world: World, event: T, time: number): boolean {
    return false;
  }

  rebase(zeroTime: number) {
    this.lastTick = Math.max(0, this.lastTick - zeroTime);
  }
}

export type TriggerHandlerFn<T> = (
  world: World,
  event: T,
  time: number
) => boolean | void;

export class TriggerFnHandler<T> extends TriggerHandler<T> {
  _fn: TriggerHandlerFn<T>;

  constructor(fn: TriggerHandlerFn<T>) {
    super();
    this._fn = fn;
  }

  runTrigger(world: World, event: T, time: number): boolean {
    return this._fn(world, event, time) === true;
  }
}

export class HandlerStep<T> {
  name: string;
  _preHandlers: TriggerHandler<T>[];
  _handlers: TriggerHandler<T>[];
  _postHandlers: TriggerHandler<T>[];

  constructor(name: string) {
    this.name = name;
    this._preHandlers = [];
    this._handlers = [];
    this._postHandlers = [];
  }

  get length(): number {
    return (
      this._preHandlers.length +
      this._handlers.length +
      this._postHandlers.length
    );
  }

  addHandler(
    handler: TriggerHandler<T> | TriggerHandlerFn<T>,
    order?: SystemOrder,
    enabled?: boolean
  ): this;
  addHandler(
    handler: TriggerHandler<T> | TriggerHandlerFn<T>,
    enabled?: boolean
  ): this;
  addHandler(
    handler: TriggerHandler<T> | TriggerHandlerFn<T>,
    ...args: any[]
  ): this {
    if (typeof handler === "function") {
      handler = new TriggerFnHandler(handler);
    }
    let order = "normal";
    if (args.length > 0 && typeof args[0] === "string") {
      order = args.shift();
    }
    let enabled = true;
    if (args.length > 0) {
      enabled = args.shift();
    }
    handler.setEnabled(enabled);
    if (order === "pre") {
      this._preHandlers.push(handler);
    } else if (order === "post") {
      this._postHandlers.push(handler);
    } else {
      this._handlers.push(handler);
    }
    return this;
  }

  start(world: World) {
    this._preHandlers.forEach((s) => s.start(world));
    this._handlers.forEach((s) => s.start(world));
    this._postHandlers.forEach((s) => s.start(world));
  }

  emit(world: World, event: T, time: number): boolean {
    // find exits if predicate returns true
    // runHandler returns true if propagationStopped
    let r =
      this._preHandlers.find((sys) => {
        return this._runHandler(world, sys, event, time);
      }) ||
      this._handlers.find((sys) => {
        return this._runHandler(world, sys, event, time);
      }) ||
      this._postHandlers.find((sys) => {
        return this._runHandler(world, sys, event, time);
      });
    return r !== undefined;
  }

  _runHandler(
    world: World,
    handler: TriggerHandler<T>,
    event: T,
    time: number
  ): boolean {
    if (!handler.shouldRun(world, time)) {
      return false;
    }

    let res = handler.runTrigger(world, event, time);
    handler.lastTick = world.tick();
    return res;
  }

  rebase(zeroTime: number) {
    this._preHandlers.forEach((s) => s.rebase(zeroTime));
    this._handlers.forEach((s) => s.rebase(zeroTime));
    this._postHandlers.forEach((s) => s.rebase(zeroTime));
  }

  forEach(fn: (handler: TriggerHandler<T>, stepName: string) => void) {
    this._preHandlers.forEach((s) => fn(s, "pre-" + this.name));
    this._handlers.forEach((s) => fn(s, this.name));
    this._postHandlers.forEach((s) => fn(s, "post-" + this.name));
  }
}

export class HandlerSet<T> {
  _event: TriggerCls<T>;
  _steps: HandlerStep<T>[];

  constructor(event: TriggerCls<T>, steps: string[] = ["emit"]) {
    this._event = event;
    this._steps = steps.map((n) => new HandlerStep(n));
  }

  get length(): number {
    return this._steps.length;
  }

  addHandler(
    handler: TriggerHandler<T> | TriggerHandlerFn<T>,
    enabled?: boolean
  ): this;
  addHandler(
    step: string,
    handler: TriggerHandler<T> | TriggerHandlerFn<T>,
    enabled?: boolean
  ): this;
  addHandler(...args: any[]): this {
    let stepName = this._steps.length > 0 ? this._steps[0].name : "emit";
    if (typeof args[0] === "string") {
      stepName = args.shift();
    }
    const handler = args.shift();
    const enabled = args.shift();

    let order: SystemOrder = "normal";
    if (stepName.includes("-")) {
      [order, stepName] = stepName.split("-") as [SystemOrder, string];
    }
    const step = this._steps.find((s) => s.name == stepName);
    if (!step) {
      throw new Error(
        "Failed to find event handler step [" +
          stepName +
          // "] in system set [" +
          // this.name +
          "]"
      );
    }

    step.addHandler(handler, order, enabled);
    return this;
  }

  addStep(name: string, opts: AddStepOpts = {}): this {
    if (name.includes("-")) throw new Error('step names cannot include "-".');
    const step = new HandlerStep(name);

    if (this._steps.find((existing) => step.name === existing.name)) {
      throw new Error("Step already exists: " + name);
    }

    if (opts.before) {
      const index = this._steps.findIndex((step) => step.name == opts.before);
      if (index < 0) {
        throw new Error(
          "Failed to find step for addStep option 'before: " +
            opts.before +
            // "' in SystemSet '" +
            // this.name +
            "'"
        );
      }
      this._steps.splice(index, 0, step);
    } else if (opts.after) {
      let index = this._steps.findIndex((step) => step.name == opts.after);
      if (index < 0) {
        throw new Error(
          "Failed to find step for addStep option 'after: " +
            opts.before +
            // "' in SystemSet '" +
            // this.name +
            "'"
        );
      }
      index += 1;
      if (index == this._steps.length) {
        this._steps.push(step);
      } else {
        this._steps.splice(index, 0, step);
      }
    } else {
      this._steps.push(step);
    }
    return this;
  }

  getStep(name: string): HandlerStep<T> | undefined {
    return this._steps.find((s) => s.name == name);
  }

  emit(world: World, event: T, time: number) {
    for (let step of this._steps) {
      if (step.emit(world, event, time)) {
        return;
      }
    }
  }

  maintain() {}

  rebase(zeroTime: number) {
    this._steps.forEach((s) => s.rebase(zeroTime));
  }
}

export type AnyHandlerSet = HandlerSet<any>;

export class TriggerManager {
  private _sets: Map<AnyTriggerCls, AnyHandlerSet>;

  constructor() {
    this._sets = new Map();
  }

  register<T>(event: TriggerCls<T>, steps?: string[]): this {
    if (this._sets.get(event)) return this;
    const set = new HandlerSet(event, steps);
    this._sets.set(event, set);
    return this;
  }

  getSet<T>(event: TriggerCls<T>): HandlerSet<T> | undefined {
    do {
      const set = this._sets.get(event);
      if (set) return set as HandlerSet<T>;
      event = Object.getPrototypeOf(event);
    } while (event && !event.isPrototypeOf(Event));
  }

  addStep<T>(event: TriggerCls<T>, name: string, opts: AddStepOpts = {}): this {
    const set = this.getSet(event);
    if (!set)
      throw new Error(
        "Failed to find registered event: " + event.constructor.name
      );
    set.addStep(name, opts);
    return this;
  }

  getStep<T>(cls: TriggerCls<T>, name: string): HandlerStep<T> | undefined {
    const set = this.getSet(cls);
    return set?.getStep(name);
  }

  addHandler<T>(
    event: TriggerCls<T>,
    handler: TriggerHandler<T> | TriggerHandlerFn<T>
  ): this;
  addHandler<T>(
    event: TriggerCls<T>,
    step: string,
    handler: TriggerHandler<T> | TriggerHandlerFn<T>
  ): this;
  addHandler<T>(event: TriggerCls<T>, ...args: any[]): this {
    const set = this.getSet(event);
    // TODO - Auto Register
    if (!set) throw new Error("Event not registered.");
    const step =
      typeof args[0] === "string" ? args.shift() : set._steps[0].name;
    const handler = args.shift();
    set.addHandler(step, handler);
    return this;
  }

  emit<T>(world: World, event: T, time: number) {
    // @ts-ignore
    const cls = event.constructor as TriggerCls<T>;
    const set = this.getSet(cls);
    if (!set) throw new Error("Event not registered.");
    set.emit(world, event, time);
  }

  maintain() {
    this._sets.forEach((set) => set.maintain());
  }

  rebase(zeroTime: number) {
    this._sets.forEach((s) => s.rebase(zeroTime));
  }
}
