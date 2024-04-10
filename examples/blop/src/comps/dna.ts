import type { Entity } from "gw-ecs/entity";
import { Effect } from "./effect";
import { Trigger } from "./trigger";

export class DNA {
  _triggers: (Trigger | null)[];
  _effects: (Effect | null)[];

  constructor(slots: number = 2) {
    this._triggers = new Array(slots);
    this._effects = new Array(slots);
  }

  get length(): number {
    return this._triggers.length;
  }

  addSlot() {
    this._triggers.push(null);
    this._effects.push(null);
  }

  getTrigger(index: number): Trigger | null {
    return this._triggers[index] || null;
  }

  firstEmptyTrigger(): number {
    return this._triggers.indexOf(null);
  }

  setTrigger(index: number, trigger: Trigger | null) {
    if (index < 0 || index >= this._triggers.length)
      throw new Error("Index out of bounds.");
    this._triggers[index] = trigger;
  }

  getEffect(index: number): Effect | null {
    return this._effects[index] || null;
  }

  firstEmptyEffect(): number {
    return this._effects.indexOf(null);
  }

  setEffect(index: number, effect: Effect | null) {
    if (index < 0 || index >= this._effects.length)
      throw new Error("Index out of bounds.");
    this._effects[index] = effect;
  }

  clone(): DNA {
    const clone = new DNA(this.length);
    clone._triggers = this._triggers.slice();
    clone._effects = this._effects.slice();
    return clone;
  }
}
