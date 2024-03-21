import { Level } from "../world/level.js";
import { EntitySystem, EntitySystemFn } from "./entitySystem.js";
import { System, SystemFn } from "./system.js";
import {
  AddEntityStepOpts,
  AddStepOpts,
  EntitySystemSet,
  SystemSet,
} from "./systemSet.js";
import { SystemStep, EntitySystemStep } from "./systemStep.js";

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
    opts?: AddStepOpts | AddEntityStepOpts | SystemStep | EntitySystemStep
  ): SystemManager;
  addStep(
    set: string,
    step: string,
    opts?: AddStepOpts | AddEntityStepOpts | SystemStep | EntitySystemStep
  ): SystemManager;
  addStep(
    ...args:
      | [
          string,
          (AddStepOpts | AddEntityStepOpts | SystemStep | EntitySystemStep)?
        ]
      | [
          string,
          string,
          (AddStepOpts | AddEntityStepOpts | SystemStep | EntitySystemStep)?
        ]
  ): SystemManager {
    if (args.length == 1) {
      args = ["default", args[0], {}];
    } else if (typeof args[1] !== "string") {
      args = ["default", args[0], args[1]];
    }

    let [setName, stepName, opts] = args as [
      string,
      string,
      (AddStepOpts | AddEntityStepOpts | SystemStep | EntitySystemStep)?
    ];
    const set = this._sets.get(setName);
    if (!set) throw new Error("Failed to find System Set: " + setName);
    let useOpts: AddStepOpts | AddEntityStepOpts = {};
    if (opts instanceof SystemStep || opts instanceof EntitySystemStep) {
      // @ts-ignore
      useOpts = { step: opts };
    } else if (opts) {
      useOpts = opts;
    }
    // @ts-ignore
    set.addStep(stepName, useOpts);

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
