import { Entity } from "../entity";
import { Queue, QueueReader, World } from "../world";
import { System, SystemFn } from "./system";
import {
  SystemOrder,
  SystemStep,
  EntitySystemStep,
  QueueSystemStep,
  AnySystemStep,
} from "./systemStep";

export interface AddStepOpts {
  before?: string;
  after?: string;
}

export function isAddStepOpts(x: any): x is AddStepOpts {
  if (typeof x !== "object") return false;
  return ["before", "after"].some((n) => n in x);
}

export type AnySystemSet = SystemSet | EntitySystemSet | QueueSystemSet<any>;

export class SystemSet extends System {
  name: string;
  steps: AnySystemStep[];

  constructor(
    name: string = "default",
    steps: (string | AnySystemStep)[] = ["update"]
  ) {
    super();
    this.name = name;
    this.steps = steps.map((n) => {
      if (typeof n === "string") return this._createStep(n);
      return n;
    });
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
  addSystem(...args: any[]): this {
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

  addStep(name: string | AnySystemStep, opts: AddStepOpts = {}): this {
    let step: AnySystemStep;
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

  getStep(name: string): AnySystemStep | undefined {
    return this.steps.find((s) => s.name == name);
  }

  start(world: World) {
    super.start(world);
    this.steps.forEach((s) => s.start(world));
  }

  run(world: World, time: number, delta: number): void {
    if (!this._runIf(world, time, delta)) return;
    this.steps.forEach((step) => step.run(world, time, delta));
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

  run(world: World, time: number, delta: number): void {
    for (let e of world.entities()) {
      this.runEntity(world, e, time, delta);
    }
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    this.steps.forEach((step) => step.runEntity(world, entity, time, delta));
  }
}

export class QueueSystemSet<T> extends SystemSet {
  // @ts-ignore
  declare steps: QueueSystemStep<T>[];
  _comp: Queue<T>;
  _reader!: QueueReader<T>;

  constructor(name: string, comp: Queue<T>, steps: string[] = ["update"]) {
    super(name, []);
    this._comp = comp;
    if (steps) {
      // has to happen after _comp is set
      steps.forEach((s) => this.addStep(s));
    }
  }

  // @ts-ignore
  _createStep(name: string): QueueSystemStep<T> {
    return new QueueSystemStep<T>(name, this._comp);
  }

  // @ts-ignore
  addStep(name: string | QueueSystemStep, opts: AddStepOpts = {}): this {
    if (name instanceof QueueSystemStep) {
      if (name._comp !== this._comp) {
        throw new Error("Steps must have same component as step.");
      }
    }
    super.addStep(name as unknown as SystemStep, opts);
  }

  start(world: World) {
    super.start(world);
    this._reader = world.getReader(this._comp);
  }

  run(world: World, time: number, delta: number): void {
    this._reader.forEach((item) => {
      this.runQueueItem(world, item, time, delta);
    });
  }

  runQueueItem(world: World, item: T, time: number, delta: number): void {
    this.steps.forEach((step) => step.runQueueItem(world, item, time, delta));
  }
}
