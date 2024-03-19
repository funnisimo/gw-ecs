import type { Effect } from "./effect";
import type { Trigger } from "./trigger";

export class DNA {
  triggers: (Trigger | null)[];
  effects: (Effect | null)[];

  constructor(slots: number = 2) {
    this.triggers = new Array(slots);
    this.effects = new Array(slots);
  }

  get length(): number {
    return this.triggers.length;
  }

  addSlot() {
    this.triggers.push(null);
    this.effects.push(null);
  }
}
