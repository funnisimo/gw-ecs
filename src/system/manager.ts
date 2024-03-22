import { Level } from "../world/level.js";
import { EntitySystem, EntitySystemFn } from "./entitySystem.js";
import { System, SystemFn } from "./system.js";
import {
  AddStepOpts,
  EntitySystemSet,
  SystemSet,
  isAddStepOpts,
} from "./systemSet.js";
import { SystemStep, EntitySystemStep } from "./systemStep.js";

export class SystemManager {
  _sets: Map<string, SystemSet | EntitySystemSet>;

  constructor() {
    this._sets = new Map();
    this._sets.set("default", new SystemSet("default"));
  }

  addSet(set: SystemSet | EntitySystemSet): SystemSet;
  addSet(name: string, steps?: string[]): SystemSet;
  addSet(
    name: string | SystemSet | EntitySystemSet,
    steps?: string[]
  ): SystemSet | EntitySystemSet {
    let newSet: SystemSet | EntitySystemSet;
    if (typeof name === "string") {
      newSet = new SystemSet(name, steps);
    } else {
      newSet = name;
    }
    if (!this._sets.has(newSet.name)) {
      this._sets.set(newSet.name, newSet);
    }
    return newSet;
  }

  getSet(name: string = "default"): SystemSet | EntitySystemSet | undefined {
    return this._sets.get(name);
  }

  addStep(
    step: string | SystemStep | EntitySystemStep,
    opts?: AddStepOpts
  ): SystemManager;
  addStep(
    set: string,
    step: string | SystemStep | EntitySystemStep,
    opts?: AddStepOpts
  ): SystemManager;
  addStep(
    ...args:
      | [string | SystemStep | EntitySystemStep, AddStepOpts?]
      | [string, string | SystemStep | EntitySystemStep, AddStepOpts?]
  ): SystemManager {
    let set: SystemSet | EntitySystemSet;
    let step: string | SystemStep | EntitySystemStep;
    let opts: AddStepOpts = {};
    if (args.length == 1) {
      set = this._sets.get("default")!;
      if (!set) throw new Error("'default' set not found.");
      step = args[0];
    } else if (args.length == 2) {
      if (isAddStepOpts(args[1])) {
        set = this._sets.get("default")!;
        if (!set) throw new Error("'default' set not found.");
        step = args[0];
        opts = args[1];
      } else {
        set = this._sets.get(args[0] as string)!;
        if (!set) throw new Error(`'${args[0]}' set not found.`);
        step = args[1]!;
      }
    } else if (args.length == 3) {
      set = this._sets.get(args[0] as string)!;
      step = args[1];
      opts = args[2]!;
    } else {
      throw new Error("Too many arguments.");
    }

    set.addStep(step as string, opts);
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

  run(level: Level, time: number, delta: number): void {
    this.runSet("default", level, time, delta);
  }

  runSet(set: string, level: Level, time: number, delta: number): void {
    const systems = this._sets.get(set);
    if (!systems) throw new Error("Missing System Set: " + set);

    systems.run(level, time, delta);
  }

  rebase(zeroTime: number) {
    this._sets.forEach((set) => set.rebase(zeroTime));
  }
}
