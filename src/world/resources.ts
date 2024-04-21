import { AnyComponent, Component } from "../component/component.js";
import { ComponentObj } from "../entity/bundle.js";

/// https://www.30secondsofcode.org/js/s/is-plain-object/
function isPlainObject(val: any): boolean {
  return !!val && typeof val === "object" && val.constructor === Object;
}

export class Resources {
  _data: Map<AnyComponent, any> = new Map();

  set<T extends Object>(val: T) {
    const comp = (<Object>val).constructor as Component<T>;
    this._data.set(comp!, val);
  }

  setAll(vals: Object | Object[] | ComponentObj) {
    if (Array.isArray(vals)) {
      vals.forEach((v) => this.set(v));
    } else if (isPlainObject(vals)) {
      Object.values(vals).forEach((v) => this.set(v));
    } else {
      this.set(vals);
    }
  }

  get<T extends Object>(comp: Component<T>): T {
    return this._data.get(comp);
  }

  // NOTE - World should not use this b/c it does not do WorldInit
  getOr<T extends Object>(comp: Component<T>, fn: () => T): T {
    const v = this._data.get(comp);
    if (v !== undefined) {
      return v;
    }
    const newV = fn();
    this.set(newV);
    return newV;
  }

  delete<T extends Object>(comp: Component<T>) {
    this._data.delete(comp);
  }
}
