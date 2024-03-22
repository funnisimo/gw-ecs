import { Entity } from "../entity";
import { Level } from "../world";
import { System, SystemFn } from "./system";
import { SystemOrder, SystemStep, EntitySystemStep } from "./systemStep";

export interface AddStepOpts {
  before?: string;
  after?: string;
}

export function isAddStepOpts(x: any): x is AddStepOpts {
  if (typeof x !== "object") return false;
  return ["before", "after"].some((n) => n in x);
}

export class SystemSet extends System {
  name: string;
  steps: (SystemStep | EntitySystemStep)[];

  constructor(name: string = "default", steps: string[] = ["update"]) {
    super();
    this.name = name;
    this.steps = steps.map((n) => this._createStep(n));
  }

  get length(): number {
    return this.steps.length;
  }

  // setSteps(steps: string[]) {
  //   if (this.steps.some((step) => step.length > 0)) {
  //     throw new Error(
  //       "Cannot reset steps on a SystemSet that already has systems in it."
  //     );
  //   }
  //   if (steps.some((name) => name.includes("-"))) {
  //     throw new Error("SystemSets cannot have names that include a '-'.");
  //   }
  //   this.steps = steps.map((n) => this._createStep(n));
  // }

  _createStep(name: string): SystemStep {
    return new SystemStep(name);
  }

  addSystem(system: System | SystemFn, enabled?: boolean): this;
  addSystem(
    stepName: string,
    system: System | SystemFn,
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

  addStep(
    name: string | SystemStep | EntitySystemStep,
    opts: AddStepOpts = {}
  ): this {
    let step: SystemStep | EntitySystemStep;
    if (typeof name === "string") {
      if (name.includes("-")) throw new Error('step names cannot include "-".');
      step = this._createStep(name);
    } else {
      step = name;
    }

    if (this.steps.find((existing) => step.name === existing.name)) {
      throw new Error("Step already exists: " + name);
    }

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

  run(level: Level, time: number, delta: number): void {
    this.steps.forEach((step) => step.run(level, time, delta));
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
  addStep(name: string | EntitySystemStep, opts: AddStepOpts = {}): this {
    super.addStep(name as unknown as SystemStep, opts);
  }

  run(level: Level, time: number, delta: number): void {
    for (let e of level.entities()) {
      this.runEntity(level, e, time, delta);
    }
  }

  runEntity(level: Level, entity: Entity, time: number, delta: number): void {
    this.steps.forEach((step) => step.runEntity(level, entity, time, delta));
  }
}
