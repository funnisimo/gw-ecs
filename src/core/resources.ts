import { AnyComponent, Component } from "../core";

export class Resources {
  _data: Map<AnyComponent, any> = new Map();

  set<T>(val: T, comp?: Component<T>) {
    // @ts-ignore
    comp = comp || val.constructor;
    this._data.set(comp!, val);
  }

  get<T>(comp: Component<T>): T {
    return this._data.get(comp);
  }

  delete<T>(comp: Component<T>) {
    this._data.delete(comp);
  }
}
