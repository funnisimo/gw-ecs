import { Entity } from "../entity/entity.js";
import { Queue, QueueReader } from "../world/queue.js";
import { World } from "../world/world.js";
import { RunIfFn, System } from "./system.js";

export class QueueSystem<T> extends System {
  _comp: Queue<T>;
  _reader!: QueueReader<T>;

  constructor(comp: Queue<T>, runIf?: RunIfFn) {
    super(runIf);
    this._comp = comp;
  }

  start(world: World): void {
    super.start(world);
    this._reader = world.getReader(this._comp);
  }

  run(world: World, time: number, delta: number): void {
    this._reader.forEach((item) => {
      this.runQueueItem(world, item, time, delta);
    });
  }

  runQueueItem(world: World, item: T, time: number, delta: number) {}

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    return this.run(world, time, delta);
  }
}

export type QueueSystemFn<T> = (
  world: World,
  item: T,
  time: number,
  delta: number
) => void;

export class QueueFunctionSystem<T> extends QueueSystem<T> {
  _fn: QueueSystemFn<T>;

  constructor(comp: Queue<T>, fn: QueueSystemFn<T>, runIf?: RunIfFn) {
    super(comp, runIf);
    this._fn = fn;
  }

  runQueueItem(world: World, item: T, time: number, delta: number): void {
    this._fn(world, item, time, delta);
  }
}
