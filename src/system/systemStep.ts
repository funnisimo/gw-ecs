import { Entity } from "../entity";
import { Level } from "../world";
import { FunctionSystem, System, SystemFn } from "./system";
import {
  EntityFunctionSystem,
  EntitySystem,
  EntitySystemFn,
} from "./entitySystem";

export type SystemOrder = "pre" | "post" | "normal";

export interface SystemStep {
  name: string;
  start(level: Level): void;
  run(level: Level, time: number, delta: number): void;
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

  run(level: Level, time: number, delta: number): void {
    this.preSystems.forEach((sys) => this._runSystem(level, sys, time, delta));
    this.systems.forEach((sys) => this._runSystem(level, sys, time, delta));
    this.postSystems.forEach((sys) => this._runSystem(level, sys, time, delta));
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

  // TODO - Add optional Aspect?

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

  run(level: Level, time: number, delta: number): void {
    for (let e of level.entities()) {
      this.runEntity(level, e, time, delta);
    }
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
