import { Entity } from "../entity/entity.js";
import { SystemFn } from "../system/system.js";

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
