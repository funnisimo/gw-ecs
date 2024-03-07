import { World } from "../world";
import { System } from "./system";

export class SystemStep {
  name: string;
  systems: System[];

  constructor(name: string) {
    this.name = name;
    this.systems = [];
  }

  addSystem(sys: System) {
    this.systems.push(sys);
  }

  start(world: World) {
    this.systems.forEach((s) => s.start(world));
  }

  run(world: World, time: number, delta: number) {
    this.systems.forEach((s) => s.run(world, time, delta));
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
    this.steps = steps.map((n) => new SystemStep(n));
  }

  setSteps(steps: string[]) {
    if (
      this.steps.length > 1 ||
      this.steps[0].name !== "update" ||
      this.steps[0].systems.length > 0
    ) {
      throw new Error(
        "Cannot set steps on a SystemSet that already has been configured."
      );
    }
    this.steps = steps.map((n) => new SystemStep(n));
  }

  addSystem(system: System, stepName = "update"): SystemSet {
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
    step.addSystem(system);
    return this;
  }

  addStep(name: string, opts: AddStepOpts = {}): SystemSet {
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

  run(world: World, time: number, delta: number) {
    this.steps.forEach((sys) => sys.run(world, time, delta));
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
  addStep(...args: any[]): SystemManager {
    if (args.length == 1) {
      args = ["default", args[0], {}];
    }
    if (typeof args[1] !== "string") {
      args = ["default", ...args];
    }

    const [setName, stepName, opts] = args;
    const set = this._sets.get(setName);
    if (!set) throw new Error("Failed to find System Set: " + setName);
    set.addStep(stepName, opts);

    return this;
  }

  addSystem(system: System, inStep?: string): SystemManager;
  addSystem(system: System, inSet: string, inStep?: string): SystemManager;
  addSystem(system: System, ...args: string[]): SystemManager {
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

  run(world: World, time: number, delta: number) {
    this.runSet("default", world, time, delta);
  }

  runSet(set: string, world: World, time: number, delta: number) {
    const systems = this._sets.get(set);
    if (!systems) throw new Error("Missing System Set: " + set);

    systems.run(world, time, delta);
  }
}
