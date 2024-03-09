import { Entity } from "../entity/entity.js";
import { World } from "../world/world.js";
import { EntitySystem } from "./entitySystem.js";
import {
  EntityFunctionSystem,
  EntitySystemFn,
  FunctionSystem,
  SystemFn,
} from "./functionSystem.js";
import { System } from "./system.js";

export type SystemOrder = "pre" | "post" | "normal";

export class SystemStep {
  name: string;
  preSystems: System[];
  systems: System[];
  postSystems: System[];

  constructor(name: string) {
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

  addSystem(sys: System | SystemFn, order?: SystemOrder) {
    if (typeof sys === "function") {
      sys = new FunctionSystem(sys);
    }
    if (order === "pre") {
      this.preSystems.push(sys);
    } else if (order === "post") {
      this.postSystems.push(sys);
    } else {
      this.systems.push(sys);
    }
  }

  start(world: World) {
    this.preSystems.forEach((s) => s.start(world));
    this.systems.forEach((s) => s.start(world));
    this.postSystems.forEach((s) => s.start(world));
  }

  run(world: World, time: number, delta: number): boolean {
    let out = false;
    out = this.preSystems.reduce((out, sys) => {
      return this._runSystem(world, sys, time, delta) || out;
    }, out);
    out = this.systems.reduce((out, sys) => {
      return this._runSystem(world, sys, time, delta) || out;
    }, out);
    out = this.postSystems.reduce((out, sys) => {
      return this._runSystem(world, sys, time, delta) || out;
    }, out);
    return out;
  }

  _runSystem(world: World, sys: System, time: number, delta: number): boolean {
    if (!sys.shouldRun(world, time, delta)) {
      return false;
    }
    // world._beforeSystemRun();
    sys.run(world, time, delta);
    sys.lastTick = world.currentTick();
    world._afterSystemRun();
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
    super.addSystem(sys, order);
  }

  runEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    let out = false;
    out = this.preSystems.reduce((out, sys) => {
      return this._runEntitySystem(world, sys, entity, time, delta) || out;
    }, out);
    out = this.systems.reduce((out, sys) => {
      return this._runEntitySystem(world, sys, entity, time, delta) || out;
    }, out);
    out = this.postSystems.reduce((out, sys) => {
      return this._runEntitySystem(world, sys, entity, time, delta) || out;
    }, out);
    return out;
  }

  _runEntitySystem(
    world: World,
    sys: EntitySystem,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    if (!sys.shouldRun(world, time, delta)) {
      return false;
    }
    if (!sys.accept(entity)) return false;
    sys.processEntity(world, entity, time, delta);
    sys.lastTick = world.currentTick();
    world._afterSystemRun();
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
}

export class SystemSet {
  name: string;
  steps: SystemStep[];

  constructor(name: string, steps: string[] = ["update"]) {
    this.name = name;
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

  addSystem(system: System | SystemFn, stepName = "update"): this {
    if (typeof system === "function") {
      system = new FunctionSystem(system);
    }
    let order: SystemOrder = "normal";
    if (stepName.includes("-")) {
      [order, stepName] = stepName.split("-") as [SystemOrder, string];
    }
    const step = this.steps.find((s) => s.name == stepName);
    if (!step) {
      throw new Error(
        "Failed to find system step [" +
          stepName +
          "] in system set [" +
          this.name +
          "]"
      );
    }
    step.addSystem(system, order);
    return this;
  }

  addStep(name: string, opts: AddStepOpts = {}): this {
    if (name.includes("-")) throw new Error('step names cannot include "-".');
    if (opts.before) {
      const index = this.steps.findIndex((step) => step.name == opts.before);
      if (index < 0) {
        throw new Error(
          "Failed to find step for addStep option 'before: " +
            opts.before +
            "' in SystemSet '" +
            this.name +
            "'"
        );
      }
      this.steps.splice(index, 0, new SystemStep(name));
    } else if (opts.after) {
      let index = this.steps.findIndex((step) => step.name == opts.after);
      if (index < 0) {
        throw new Error(
          "Failed to find step for addStep option 'after: " +
            opts.before +
            "' in SystemSet '" +
            this.name +
            "'"
        );
      }
      index += 1;
      if (index == this.steps.length) {
        this.steps.push(new SystemStep(name));
      } else {
        this.steps.splice(index, 0, new SystemStep(name));
      }
    } else {
      this.steps.push(new SystemStep(name));
    }
    return this;
  }

  getStep(name: string): SystemStep | undefined {
    return this.steps.find((s) => s.name == name);
  }

  start(world: World) {
    this.steps.forEach((s) => s.start(world));
  }

  run(world: World, time: number, delta: number): boolean {
    return this.steps.reduce(
      (out, step) => step.run(world, time, delta) || out,
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

  // @ts-ignore
  addSystem(system: EntitySystem | EntitySystemFn, stepName = "update"): this {
    if (typeof system === "function") {
      system = new EntityFunctionSystem(system);
    }
    return super.addSystem(system, stepName);
  }

  runEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    return this.steps.reduce(
      (out, step) => step.runEntity(world, entity, time, delta) || out,
      false
    );
  }
}

export class SystemManager {
  _sets: Map<string, SystemSet>;

  constructor() {
    this._sets = new Map();
    this._sets.set("default", new SystemSet("default"));
  }

  addSet(name: string, steps?: string[]): SystemManager {
    if (!this._sets.has(name)) {
      this._sets.set(name, new SystemSet(name, steps));
    }
    return this;
  }

  getSet(name: string = "default"): SystemSet | undefined {
    return this._sets.get(name);
  }

  addStep(set: string, step: string, opts?: AddStepOpts): SystemManager;
  addStep(step: string, opts?: AddStepOpts): SystemManager;
  addStep(
    ...args: [string, AddStepOpts?] | [string, string, AddStepOpts?]
  ): SystemManager {
    if (args.length == 1) {
      args = ["default", args[0], {}];
    }
    if (typeof args[1] !== "string") {
      args = ["default", args[0], args[1]];
    }

    const [setName, stepName, opts] = args as [string, string, AddStepOpts?];
    const set = this._sets.get(setName);
    if (!set) throw new Error("Failed to find System Set: " + setName);
    set.addStep(stepName, opts);

    return this;
  }

  addSystem(system: System | SystemFn, inStep?: string): SystemManager;
  addSystem(
    system: System | SystemFn,
    inSet: string,
    inStep?: string
  ): SystemManager;
  addSystem(system: System | SystemFn, ...args: string[]): SystemManager {
    if (typeof system === "function") {
      system = new FunctionSystem(system);
    }

    if (args.length == 0) {
      args = ["default", "update"];
    }
    if (args.length == 1) {
      args = ["default", args[0]];
    }
    const [setName, stepName] = args;

    const set = this._sets.get(setName);
    if (!set) {
      throw new Error("Missing System Set: " + setName);
    }
    set.addSystem(system, stepName);
    return this;
  }

  start(world: World) {
    for (let set of this._sets.values()) {
      set.start(world);
    }
  }

  run(world: World, time: number, delta: number): boolean {
    return this.runSet("default", world, time, delta);
  }

  runSet(set: string, world: World, time: number, delta: number): boolean {
    const systems = this._sets.get(set);
    if (!systems) throw new Error("Missing System Set: " + set);

    return systems.run(world, time, delta);
  }

  rebase(zeroTime: number) {
    this._sets.forEach((set) => set.rebase(zeroTime));
  }
}
