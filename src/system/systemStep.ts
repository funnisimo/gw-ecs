import { Entity } from "../entity";
import { Level } from "../world";
import { FunctionSystem, System, SystemFn } from "./system";
import {
  EntityFunctionSystem,
  EntitySystem,
  EntitySystemFn,
} from "./entitySystem";

export type SystemOrder = "pre" | "normal" | "post";

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
  _preSystems: System[];
  _systems: System[];
  _postSystems: System[];

  constructor(name: string) {
    super();
    this.name = name;
    this._systems = [];
    this._preSystems = [];
    this._postSystems = [];
  }

  get length(): number {
    return (
      this._preSystems.length + this._systems.length + this._postSystems.length
    );
  }

  addSystem(sys: System | SystemFn, order?: SystemOrder, enabled = true) {
    if (typeof sys === "function") {
      sys = new FunctionSystem(sys);
    }
    sys.setEnabled(enabled);
    if (order === "pre") {
      this._preSystems.push(sys);
    } else if (order === "post") {
      this._postSystems.push(sys);
    } else {
      this._systems.push(sys);
    }
  }

  start(level: Level) {
    super.start(level);
    this._preSystems.forEach((s) => s.start(level));
    this._systems.forEach((s) => s.start(level));
    this._postSystems.forEach((s) => s.start(level));
  }

  run(level: Level, time: number, delta: number): void {
    this._preSystems.forEach((sys) => this._runSystem(level, sys, time, delta));
    this._systems.forEach((sys) => this._runSystem(level, sys, time, delta));
    this._postSystems.forEach((sys) =>
      this._runSystem(level, sys, time, delta)
    );
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
    this._preSystems.forEach((s) => s.rebase(zeroTime));
    this._systems.forEach((s) => s.rebase(zeroTime));
    this._postSystems.forEach((s) => s.rebase(zeroTime));
  }

  forEach(fn: (sys: System, stepName: string) => void) {
    this._preSystems.forEach((s) => fn(s, "pre-" + this.name));
    this._systems.forEach((s) => fn(s, this.name));
    this._postSystems.forEach((s) => fn(s, "post-" + this.name));
  }
}

export class EntitySystemStep extends SystemStep {
  declare _preSystems: EntitySystem[];
  declare _systems: EntitySystem[];
  declare _postSystems: EntitySystem[];

  // TODO - Add optional Aspect?

  // @ts-ignore
  addSystem(
    sys: EntitySystem | EntitySystemFn,
    order?: SystemOrder,
    enabled = true
  ) {
    if (typeof sys === "function") {
      sys = new EntityFunctionSystem(sys);
    }
    if (!(sys instanceof EntitySystem)) {
      throw new Error("Must be EntitySystem");
    }
    super.addSystem(sys, order, enabled);
  }

  run(level: Level, time: number, delta: number): void {
    for (let e of level.entities()) {
      this.runEntity(level, e, time, delta);
    }
  }

  runEntity(level: Level, entity: Entity, time: number, delta: number): void {
    this._preSystems.forEach((sys) =>
      this._runEntitySystem(level, sys, entity, time, delta)
    );
    this._systems.forEach((sys) =>
      this._runEntitySystem(level, sys, entity, time, delta)
    );
    this._postSystems.forEach((sys) =>
      this._runEntitySystem(level, sys, entity, time, delta)
    );
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
    sys.runEntity(level, entity, time, delta);
    sys.lastTick = level.currentTick();
    level.maintain();
    return true;
  }

  forEach(fn: (sys: EntitySystem, order: SystemOrder) => void) {
    // @ts-ignore
    super.forEach(fn);
  }
}
