import { AnyComponent, Component } from "../component/component.js";

export type AnyResourceCtr = AnyComponent;

export class Resources {
  _data: Map<AnyComponent, any> = new Map();

  set<T>(val: T) {
    const comp = (<any>val).constructor;
    this._data.set(comp!, val);
  }

  get<T>(comp: Component<T>): T {
    return this._data.get(comp);
  }

  // getOr<T>(comp: Component<T>, fn: () => T): T {
  //   const v = this._data.get(comp);
  //   if (v !== undefined) {
  //     return v;
  //   }
  //   const newV = fn();
  //   this.set(newV);
  //   return newV;
  // }

  delete<T>(comp: Component<T>) {
    this._data.delete(comp);
  }
}
