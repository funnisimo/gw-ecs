import { Entity } from "../entity/entity.js";
import { RunIfFn, System, SystemFn } from "../system/system.js";
import { EntitySystemSet } from "../system/systemSet.js";
import { World } from "../world/world.js";

export type TaskType = Entity | SystemFn;

interface TaskInfo {
  item: TaskType | null;
  time: number;
  nextItem: TaskInfo | null;
}

export class Schedule {
  private nextItem: TaskInfo | null;
  public time: number;
  private cache: TaskInfo | null;

  constructor() {
    this.nextItem = null;
    this.time = 0;
    this.cache = null;
  }

  clear() {
    while (this.nextItem) {
      const current = this.nextItem;
      this.nextItem = current.nextItem;
      current.nextItem = this.cache;
      this.cache = current;
    }
  }

  add(item: TaskType, delay = 1) {
    let entry;

    if (this.cache) {
      entry = this.cache;
      this.cache = entry.nextItem;
      entry.nextItem = null;
    } else {
      entry = { item: null, time: 0, nextItem: null };
    }
    entry.item = item;
    entry.time = this.time + delay;
    if (!this.nextItem) {
      this.nextItem = entry;
    } else {
      let current = this as unknown as TaskInfo;
      let next = current.nextItem;
      while (next && next.time <= entry.time) {
        current = next;
        next = current.nextItem;
      }
      entry.nextItem = current.nextItem;
      current.nextItem = entry;
    }
    return entry;
  }

  //   next(): TaskType | null {
  //     const n = this.nextItem;
  //     if (!n) return null;
  //     this.time = Math.max(n.time, this.time); // so you can schedule -1 as a time uint
  //     return n.item;
  //   }

  pop(): TaskType | null {
    const n = this.nextItem;
    if (!n) return null;

    this.nextItem = n.nextItem;
    n.nextItem = this.cache;
    this.cache = n;

    this.time = Math.max(n.time, this.time); // so you can schedule -1 as a time uint
    return n.item;
  }

  restore(item: TaskType) {
    this.add(item, -1);
  }

  remove(item: TaskType) {
    if (!item || !this.nextItem) return;
    if (this.nextItem.item === item) {
      this.nextItem = this.nextItem.nextItem;
      return;
    }
    let prev = this.nextItem;
    let current = prev.nextItem;
    while (current && current.item !== item) {
      prev = current;
      current = current.nextItem;
    }

    if (current && current.item === item) {
      prev.nextItem = current.nextItem;
    }
  }
}

export class ScheduleSystem extends System {
  setName: string;
  systems!: EntitySystemSet;

  constructor(setName: string, runIf?: RunIfFn) {
    super(runIf);
    this.setName = setName;
  }

  start(world: World) {
    this.systems = world.getSystemSet(this.setName) as EntitySystemSet;
    if (!this.systems) {
      throw new Error(
        "Could not find configured EntitySytemSet: " + this.setName
      );
    } else if (!(this.systems instanceof EntitySystemSet)) {
      throw new Error(
        "Configured system set is not an EntitySytemSet: " + this.setName
      );
    }
  }

  shouldRun(world: World, time: number, delta: number): boolean {
    const schedule = world.getUnique(Schedule);
    return super.shouldRun(world, schedule.time, 0);
  }

  run(world: World, time: number, delta: number) {
    const schedule = world.getUnique(Schedule);

    let entity = schedule.pop();
    while (entity) {
      if (entity instanceof Entity) {
        // TODO - what to do with delta in gameTurn mode?
        if (!this.runEntity(world, entity, schedule.time, 0)) {
          schedule.restore(entity);
          return;
        }
      } else {
        const fn: SystemFn = entity;
        fn(world, schedule.time, 0);
      }

      // Using RunIf to check to see if we should break out because of FX or animation or something else that is going on in
      if (!super.shouldRun(world, schedule.time, 0)) return;
      entity = schedule.pop();
    }
  }

  runEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    this.systems.runEntity(world, entity, time, delta);
    return true;
  }
}
