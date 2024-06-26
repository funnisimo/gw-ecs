import { Entity } from "../entity";
import { Queue, QueueReader, World } from "../world";
import { FunctionSystem, System, SystemFn } from "./system";
import {
  EntityFunctionSystem,
  EntitySystem,
  EntitySystemFn,
} from "./entitySystem";
import { QueueFunctionSystem, QueueSystem, QueueSystemFn } from "./queueSystem";

export type SystemOrder = "pre" | "normal" | "post";
export type AnySystemStep =
  | SystemStep
  | EntitySystemStep
  | QueueSystemStep<any>;

export interface SystemStep {
  name: string;
  start(world: World): void;
  run(world: World, time: number, delta: number): void;
  rebase(zeroTime: number): void;
  addSystem(
    sys: System | SystemFn,
    order?: SystemOrder,
    enabled?: boolean
  ): System;
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

  addSystem(sys: System | SystemFn, order?: SystemOrder, enabled = true): this {
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
    return this;
  }

  start(world: World) {
    super.start(world);
    this._preSystems.forEach((s) => s.start(world));
    this._systems.forEach((s) => s.start(world));
    this._postSystems.forEach((s) => s.start(world));
  }

  run(world: World, time: number, delta: number): void {
    if (!this._runIf(world, time, delta, this.lastTick)) return;
    this._preSystems.forEach((sys) => this._runSystem(world, sys, time, delta));
    this._systems.forEach((sys) => this._runSystem(world, sys, time, delta));
    this._postSystems.forEach((sys) =>
      this._runSystem(world, sys, time, delta)
    );
  }

  _runSystem(world: World, sys: System, time: number, delta: number): boolean {
    if (!sys.shouldRun(world, time, delta)) {
      return false;
    }
    sys.run(world, time, delta);
    sys.lastTick = world.tick();
    // world.maintain();
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
  // declare _preSystems: EntitySystem[];
  // declare _systems: EntitySystem[];
  // declare _postSystems: EntitySystem[];

  // TODO - Add optional Aspect?

  addSystem(sys: System | SystemFn, order?: SystemOrder, enabled = true): this {
    if (typeof sys === "function") {
      sys = new EntityFunctionSystem(sys as unknown as EntitySystemFn);
    }
    // if (!(sys instanceof EntitySystem)) {
    //   throw new Error("Must be EntitySystem");
    // }
    super.addSystem(sys, order, enabled);
    return this;
  }

  run(world: World, time: number, delta: number): void {
    if (!this._runIf(world, time, delta, this.lastTick)) return;
    world.level.entities().forEach((entity) => {
      this.runEntity(world, entity, time, delta);
    });
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    this._preSystems.forEach((sys) =>
      this._runEntitySystem(world, sys, entity, time, delta)
    );
    this._systems.forEach((sys) =>
      this._runEntitySystem(world, sys, entity, time, delta)
    );
    this._postSystems.forEach((sys) =>
      this._runEntitySystem(world, sys, entity, time, delta)
    );
  }

  _runEntitySystem(
    world: World,
    sys: System | EntitySystem,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    if (!sys.shouldRun(world, time, delta)) {
      return false;
    }
    if ("accept" in sys && !sys.accept(entity)) return false;
    sys.runEntity(world, entity, time, delta);
    sys.lastTick = world.tick();
    // world.maintain();
    return true;
  }

  // TODO - Wish this could be EntitySytem
  forEach(fn: (sys: System, order: string) => void) {
    super.forEach(fn);
  }
}

export class QueueSystemStep<T> extends SystemStep {
  _queue: Queue<T>;
  _reader!: QueueReader<T>;
  // declare _preSystems: QueueSystem<T>[];
  // declare _systems: QueueSystem<T>[];
  // declare _postSystems: QueueSystem<T>[];

  constructor(name: string, comp: Queue<T>) {
    super(name);
    this._queue = comp;
  }

  start(world: World): void {
    this._reader = world.getReader(this._queue);
    super.start(world);
  }

  addSystem(sys: System | SystemFn, order?: SystemOrder, enabled = true): this {
    if (typeof sys === "function") {
      sys = new QueueFunctionSystem<T>(
        this._queue,
        sys as unknown as QueueSystemFn<T>
      );
    } else if ("_queue" in sys && this._queue !== sys._queue) {
      throw new Error("System has wrong component type.");
    }
    // if (!(sys instanceof QueueSystem)) {
    //   throw new Error("Must be QueueSystem");
    // }
    super.addSystem(sys, order, enabled);
    return this;
  }

  run(world: World, time: number, delta: number): void {
    if (!this._runIf(world, time, delta, this.lastTick)) return;
    // TODO - prefilter systems with 'shouldRun' check?
    this._reader.forEach((item) => {
      this.runQueueItem(world, item, time, delta);
    });
  }

  runQueueItem(world: World, item: T, time: number, delta: number): void {
    this._preSystems.forEach((sys) =>
      this._runQueueSystem(world, sys, item, time, delta)
    );
    this._systems.forEach((sys) =>
      this._runQueueSystem(world, sys, item, time, delta)
    );
    this._postSystems.forEach((sys) =>
      this._runQueueSystem(world, sys, item, time, delta)
    );
  }

  _runQueueSystem(
    world: World,
    sys: System | QueueSystem<T>,
    item: T,
    time: number,
    delta: number
  ): boolean {
    if (!sys.shouldRun(world, time, delta)) {
      return false;
    }
    sys.runQueueItem(world, item, time, delta);
    sys.lastTick = world.tick();
    // world.maintain();
    return true;
  }

  // TODO - Wish this could be QueueSystem<T>
  forEach(fn: (sys: System, order: string) => void) {
    super.forEach(fn);
  }
}
