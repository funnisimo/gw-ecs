import { Entity } from "../entity/entity.js";
import { Level } from "../world/level.js";
import {
  EntitySystem,
  EntityFunctionSystem,
  EntitySystemFn,
} from "./entitySystem.js";
import { System, FunctionSystem, SystemFn } from "./system.js";

export type SystemOrder = "pre" | "post" | "normal";

export interface SystemStep {
  name: string;
  start(level: Level): void;
  run(level: Level, time: number, delta: number): boolean;
  rebase(zeroTime: number): void;
  addSystem(
    sys: System | SystemFn,
    order?: SystemOrder,
    enabled?: boolean
  ): void;
}

export class SystemStep extends System {
  name: string;
  preSystems: System[];
  systems: System[];
  postSystems: System[];

  constructor(name: string = "update") {
    super();
    this.name = name;
    this.systems = [];
    this.preSystems = [];
    this.postSystems = [];
  }

  get length(): number {
    return (
      this.preSystems.length + this.systems.length + this.postSystems.length
    );
  }

  addSystem(sys: System | SystemFn, order?: SystemOrder, enabled = true) {
    if (typeof sys === "function") {
      sys = new FunctionSystem(sys);
    }
    sys.setEnabled(enabled);
    if (order === "pre") {
      this.preSystems.push(sys);
    } else if (order === "post") {
      this.postSystems.push(sys);
    } else {
      this.systems.push(sys);
    }
  }

  start(level: Level) {
    super.start(level);
    this.preSystems.forEach((s) => s.start(level));
    this.systems.forEach((s) => s.start(level));
    this.postSystems.forEach((s) => s.start(level));
  }

  run(level: Level, time: number, delta: number): boolean {
    let out = false;
    out = this.preSystems.reduce((out, sys) => {
      return this._runSystem(level, sys, time, delta) || out;
    }, out);
    out = this.systems.reduce((out, sys) => {
      return this._runSystem(level, sys, time, delta) || out;
    }, out);
    out = this.postSystems.reduce((out, sys) => {
      return this._runSystem(level, sys, time, delta) || out;
    }, out);
    return out;
  }

  _runSystem(level: Level, sys: System, time: number, delta: number): boolean {
    if (!sys.shouldRun(level, time, delta)) {
      return false;
    }
    sys.run(level, time, delta);
    sys.lastTick = level.currentTick();
    level.maintain();
    return true;
  }

  rebase(zeroTime: number) {
    this.preSystems.forEach((s) => s.rebase(zeroTime));
    this.systems.forEach((s) => s.rebase(zeroTime));
    this.postSystems.forEach((s) => s.rebase(zeroTime));
  }

  forEach(fn: (sys: System, stepName: string) => void) {
    this.preSystems.forEach((s) => fn(s, "pre-" + this.name));
    this.systems.forEach((s) => fn(s, this.name));
    this.postSystems.forEach((s) => fn(s, "post-" + this.name));
  }
}

export class EntitySystemStep extends SystemStep {
  declare preSystems: EntitySystem[];
  declare systems: EntitySystem[];
  declare postSystems: EntitySystem[];

  // @ts-ignore
  addSystem(sys: EntitySystem | EntitySystemFn, order?: SystemOrder) {
    if (typeof sys === "function") {
      sys = new EntityFunctionSystem(sys);
    }
    if (!(sys instanceof EntitySystem)) {
      throw new Error("Must be EntitySystem");
    }
    super.addSystem(sys, order);
  }

  run(level: Level, time: number, delta: number): boolean {
    for (let e of level.entities()) {
      this.runEntity(level, e, time, delta);
    }
    return true;
  }

  runEntity(
    level: Level,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    let out = false;
    out = this.preSystems.reduce((out, sys) => {
      return this._runEntitySystem(level, sys, entity, time, delta) || out;
    }, out);
    out = this.systems.reduce((out, sys) => {
      return this._runEntitySystem(level, sys, entity, time, delta) || out;
    }, out);
    out = this.postSystems.reduce((out, sys) => {
      return this._runEntitySystem(level, sys, entity, time, delta) || out;
    }, out);
    return out;
  }

  _runEntitySystem(
    level: Level,
    sys: EntitySystem,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    if (!sys.shouldRun(level, time, delta)) {
      return false;
    }
    if (!sys.accept(entity)) return false;
    sys.processEntity(level, entity, time, delta);
    sys.lastTick = level.currentTick();
    level.maintain();
    return true;
  }

  forEach(fn: (sys: EntitySystem, order: SystemOrder) => void) {
    // @ts-ignore
    super.forEach(fn);
  }
}

export interface AddStepOpts {
  before?: string;
  after?: string;
  step?: SystemStep | EntitySystemStep;
}

export class SystemSet extends System {
  // name: string;
  steps: (SystemStep | EntitySystemStep)[];

  constructor(/* name: string, */ steps: string[] = ["update"]) {
    super();
    // this.name = name;
    this.steps = steps.map((n) => this._createStep(n));
  }

  setSteps(steps: string[]) {
    if (this.steps.some((step) => step.length > 0)) {
      throw new Error(
        "Cannot reset steps on a SystemSet that already has systems in it."
      );
    }
    if (steps.some((name) => name.includes("-"))) {
      throw new Error("SystemSets cannot have names that include a '-'.");
    }
    this.steps = steps.map((n) => this._createStep(n));
  }

  _createStep(name: string): SystemStep {
    return new SystemStep(name);
  }

  addSystem(
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enabled?: boolean
  ): this;
  addSystem(
    stepName: string,
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enabled?: boolean
  ): this;
  addSystem(...args: any[]) {
    let stepName = "update";
    if (typeof args[0] === "string") {
      stepName = args.shift();
    }
    const system = args.shift();
    const enabled = args.shift();

    let order: SystemOrder = "normal";
    if (stepName.includes("-")) {
      [order, stepName] = stepName.split("-") as [SystemOrder, string];
    }
    const step = this.steps.find((s) => s.name == stepName);
    if (!step) {
      throw new Error(
        "Failed to find system step [" +
          stepName +
          // "] in system set [" +
          // this.name +
          "]"
      );
    }
    // @ts-ignore
    step.addSystem(system, order, enabled);
    return this;
  }

  addStep(name: string, opts: AddStepOpts = {}): this {
    const step = opts.step || this._createStep(name);
    step.name = name;

    if (this.steps.find((step) => step.name === name)) {
      throw new Error("Step already exists: " + name);
    }

    if (name.includes("-")) throw new Error('step names cannot include "-".');
    if (opts.before) {
      const index = this.steps.findIndex((step) => step.name == opts.before);
      if (index < 0) {
        throw new Error(
          "Failed to find step for addStep option 'before: " +
            opts.before +
            // "' in SystemSet '" +
            // this.name +
            "'"
        );
      }
      this.steps.splice(index, 0, step);
    } else if (opts.after) {
      let index = this.steps.findIndex((step) => step.name == opts.after);
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
      if (index == this.steps.length) {
        this.steps.push(step);
      } else {
        this.steps.splice(index, 0, step);
      }
    } else {
      this.steps.push(step);
    }
    return this;
  }

  getStep(name: string): SystemStep | EntitySystemStep | undefined {
    return this.steps.find((s) => s.name == name);
  }

  start(level: Level) {
    super.start(level);
    this.steps.forEach((s) => s.start(level));
  }

  run(level: Level, time: number, delta: number): boolean {
    return this.steps.reduce(
      (out, step) => step.run(level, time, delta) || out,
      false
    );
  }

  rebase(zeroTime: number) {
    this.steps.forEach((step) => step.rebase(zeroTime));
  }

  forEach(fn: (system: System, step: string) => void) {
    this.steps.forEach((step) => {
      step.forEach(fn);
    });
  }
}

export class EntitySystemSet extends SystemSet {
  // @ts-ignore
  declare steps: EntitySystemStep[];

  // @ts-ignore
  _createStep(name: string): EntitySystemStep {
    return new EntitySystemStep(name);
  }

  addStep(name: string, opts: AddStepOpts = {}): this {
    const step = opts.step || this._createStep(name);
    if (!(step instanceof EntitySystemStep)) {
      throw new Error("Step must be EntitySystemStep");
    }
    opts.step = step;
    return super.addStep(name, opts);
  }

  // // @ts-ignore
  // addSystem(
  //   stepName: string,
  //   system: EntitySystem | EntitySystemFn,
  //   enabled = true
  // ): this {
  //   if (typeof system === "function") {
  //     system = new EntityFunctionSystem(system);
  //   }
  //   return super.addSystem(stepName, system, enabled);
  // }

  run(level: Level, time: number, delta: number): boolean {
    for (let e of level.entities()) {
      this.runEntity(level, e, time, delta);
    }
    return true;
  }

  runEntity(
    level: Level,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    return this.steps.reduce(
      (out, step) => step.runEntity(level, entity, time, delta) || out,
      false
    );
  }
}

export class SystemManager {
  _sets: Map<string, SystemSet | EntitySystemSet>;

  constructor() {
    this._sets = new Map();
    this._sets.set("default", new SystemSet());
  }

  addSet(
    name: string,
    set?: string[] | SystemSet | EntitySystemSet
  ): SystemManager {
    let newSet: SystemSet | EntitySystemSet;
    if (!set) {
      newSet = new SystemSet();
    } else if (Array.isArray(set)) {
      newSet = new SystemSet(set);
    } else {
      newSet = set;
    }
    if (!this._sets.has(name)) {
      this._sets.set(name, newSet);
    }
    return this;
  }

  getSet(name: string = "default"): SystemSet | EntitySystemSet | undefined {
    return this._sets.get(name);
  }

  addStep(
    step: string,
    opts?: AddStepOpts | SystemStep | EntitySystemStep
  ): SystemManager;
  addStep(
    set: string,
    step: string,
    opts?: AddStepOpts | SystemStep | EntitySystemStep
  ): SystemManager;
  addStep(
    ...args:
      | [string, (AddStepOpts | SystemStep | EntitySystemStep)?]
      | [string, string, (AddStepOpts | SystemStep | EntitySystemStep)?]
  ): SystemManager {
    if (args.length == 1) {
      args = ["default", args[0], {}];
    } else if (typeof args[1] !== "string") {
      args = ["default", args[0], args[1]];
    }

    let [setName, stepName, opts] = args as [
      string,
      string,
      (AddStepOpts | SystemStep | EntitySystemStep)?
    ];
    const set = this._sets.get(setName);
    if (!set) throw new Error("Failed to find System Set: " + setName);
    if (opts instanceof SystemStep || opts instanceof EntitySystemStep) {
      opts = { step: opts };
    }
    set.addStep(stepName, opts);

    return this;
  }

  addSystem(
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enabled?: boolean
  ): this;
  addSystem(
    inStep: string,
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enabled?: boolean
  ): this;
  addSystem(
    inSet: string,
    inStep: string,
    system: System | SystemFn | EntitySystem | EntitySystemFn,
    enabled?: boolean
  ): this;
  addSystem(...args: any[]): this {
    let setName = "default";
    let stepName = "update";
    if (typeof args[0] === "string") {
      stepName = args.shift();
    }
    if (typeof args[0] === "string") {
      setName = stepName;
      stepName = args.shift();
    }
    let system = args.shift();
    // if (args[0] instanceof System) {
    //   system = args.shift();
    // } else if (typeof args[0] === "function") {
    //   system = new FunctionSystem(args.shift());
    // } else {
    //   throw new Error("No system provided.");
    // }

    let enabled = true;
    if (typeof args[0] === "boolean") {
      enabled = args.shift();
    }

    const set = this._sets.get(setName);
    if (!set) {
      throw new Error("Missing System Set: " + setName);
    }
    set.addSystem(stepName, system, enabled);
    return this;
  }

  start(level: Level) {
    for (let set of this._sets.values()) {
      set.start(level);
    }
  }

  run(level: Level, time: number, delta: number): boolean {
    return this.runSet("default", level, time, delta);
  }

  runSet(set: string, level: Level, time: number, delta: number): boolean {
    const systems = this._sets.get(set);
    if (!systems) throw new Error("Missing System Set: " + set);

    return systems.run(level, time, delta);
  }

  rebase(zeroTime: number) {
    this._sets.forEach((set) => set.rebase(zeroTime));
  }
}
