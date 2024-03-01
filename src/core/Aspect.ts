import type { AnyComponent } from "./component";

export class Aspect {
  protected _allComponents: AnyComponent[];
  protected _oneComponents: AnyComponent[][];
  protected _someComponents: AnyComponent[][];
  protected _noneComponents: AnyComponent[];

  constructor() {
    this._allComponents = [];
    this._oneComponents = [];
    this._noneComponents = [];
    this._someComponents = [];
  }

  accept(components: AnyComponent[]): boolean {
    return (
      this._checkAll(components) &&
      this._checkOne(components) &&
      this._checkSome(components) &&
      this._checkNone(components)
    );
  }

  all(...components: AnyComponent[]): Aspect {
    this._allComponents = this._allComponents.concat(components);
    return this;
  }

  one(...components: AnyComponent[]): Aspect {
    if (components.length == 0) return this;
    this._oneComponents.push(components);
    return this;
  }

  some(...components: AnyComponent[]): Aspect {
    if (components.length == 0) return this;
    this._someComponents.push(components);
    return this;
  }

  none(...components: AnyComponent[]): Aspect {
    this._noneComponents = this._noneComponents.concat(components);
    return this;
  }

  protected _checkAll(components: AnyComponent[]) {
    return (
      this._allComponents.length === 0 ||
      this._allComponents.every((componentName: AnyComponent) =>
        components.includes(componentName)
      )
    );
  }

  protected _checkOne(components: AnyComponent[]) {
    return (
      this._oneComponents.length === 0 ||
      this._oneComponents.every((set: AnyComponent[]) => {
        return (
          set.length == 0 ||
          set.reduce(
            (count: number, componentName: AnyComponent) =>
              components.includes(componentName) ? count + 1 : count,
            0
          ) == 1
        );
      })
    );
  }

  protected _checkSome(components: AnyComponent[]): boolean {
    return (
      this._someComponents.length === 0 ||
      this._someComponents.some((set: AnyComponent[]): boolean => {
        return (
          set.length == 0 ||
          set.some((componentName: AnyComponent) =>
            components.includes(componentName)
          )
        );
      })
    );
  }

  protected _checkNone(components: AnyComponent[]) {
    return (
      this._noneComponents.length === 0 ||
      this._noneComponents.every(
        (componentName: AnyComponent) => !components.includes(componentName)
      )
    );
  }
}
