import { World } from "../world/world.js";
import { EntitySystem, EntitySystemFn } from "./entitySystem.js";
import { QueueSystem, QueueSystemFn } from "./queueSystem.js";
import { System, SystemFn } from "./system.js";
import {
  AddStepOpts,
  EntitySystemSet,
  QueueSystemSet,
  SystemSet,
  isAddStepOpts,
} from "./systemSet.js";
import { SystemStep, EntitySystemStep, QueueSystemStep } from "./systemStep.js";

export type AnySystemSet = SystemSet | EntitySystemSet | QueueSystemSet<any>;
export type AnySystemStep =
  | SystemStep
  | EntitySystemStep
  | QueueSystemStep<any>;
export type AnySystem =
  | System
  | SystemFn
  | EntitySystem
  | EntitySystemFn
  | QueueSystem<any>
  | QueueSystemFn<any>;

export class SystemManager {
  _sets: Map<string, AnySystemSet>;

  constructor() {
    this._sets = new Map();
    this._sets.set("default", new SystemSet("default"));
  }

  addSet(set: AnySystemSet): SystemSet;
  addSet(name: string, steps?: string[]): SystemSet;
  addSet(name: string | AnySystemSet, steps?: string[]): AnySystemSet {
    let newSet: AnySystemSet;
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

  getSet(name: string = "default"): AnySystemSet | undefined {
    return this._sets.get(name);
  }

  has(name: string): boolean {
    return this._sets.has(name);
  }

  addStep(step: string | AnySystemStep, opts?: AddStepOpts): SystemManager;
  addStep(
    set: string,
    step: string | AnySystemStep,
    opts?: AddStepOpts
  ): SystemManager;
  addStep(
    ...args:
      | [string | AnySystemStep, AddStepOpts?]
      | [string, string | AnySystemStep, AddStepOpts?]
  ): SystemManager {
    let set: AnySystemSet;
    let step: string | AnySystemStep;
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

  addSystem(system: AnySystem, enabled?: boolean): this;
  addSystem(inStep: string, system: AnySystem, enabled?: boolean): this;
  addSystem(
    inSet: string,
    inStep: string,
    system: AnySystem,
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

  start(world: World) {
    for (let set of this._sets.values()) {
      set.start(world);
    }
  }

  run(world: World, time: number, delta: number): void {
    this.runSet("default", world, time, delta);
  }

  runSet(set: string, world: World, time: number, delta: number): void {
    const systems = this._sets.get(set);
    if (!systems) throw new Error("Missing System Set: " + set);

    systems.run(world, time, delta);
  }

  rebase(zeroTime: number) {
    this._sets.forEach((set) => set.rebase(zeroTime));
  }
}
