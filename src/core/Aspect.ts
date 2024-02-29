export class Aspect {
  protected _allComponents: string[];
  protected _oneComponents: string[][];
  protected _someComponents: string[][];
  protected _noneComponents: string[];

  constructor() {
    this._allComponents = [];
    this._oneComponents = [];
    this._noneComponents = [];
    this._someComponents = [];
  }

  accept(components: string[]): boolean {
    return (
      this._checkAll(components) &&
      this._checkOne(components) &&
      this._checkSome(components) &&
      this._checkNone(components)
    );
  }

  all(...components: string[]): Aspect {
    this._allComponents = this._allComponents.concat(components);
    return this;
  }

  one(...components: string[]): Aspect {
    if (components.length == 0) return this;
    this._oneComponents.push(components);
    return this;
  }

  some(...components: string[]): Aspect {
    if (components.length == 0) return this;
    this._someComponents.push(components);
    return this;
  }

  none(...components: string[]): Aspect {
    this._noneComponents = this._noneComponents.concat(components);
    return this;
  }

  protected _checkAll(components: string[]) {
    return (
      this._allComponents.length === 0 ||
      this._allComponents.every((componentName: string) =>
        components.includes(componentName)
      )
    );
  }

  protected _checkOne(components: string[]) {
    return (
      this._oneComponents.length === 0 ||
      this._oneComponents.every((set: string[]) => {
        return (
          set.length == 0 ||
          set.reduce(
            (count: number, componentName: string) =>
              components.includes(componentName) ? count + 1 : count,
            0
          ) == 1
        );
      })
    );
  }

  protected _checkSome(components: string[]): boolean {
    return (
      this._someComponents.length === 0 ||
      this._someComponents.some((set: string[]): boolean => {
        return (
          set.length == 0 ||
          set.some((componentName: string) =>
            components.includes(componentName)
          )
        );
      })
    );
  }

  protected _checkNone(components: string[]) {
    return (
      this._noneComponents.length === 0 ||
      this._noneComponents.every(
        (componentName: string) => !components.includes(componentName)
      )
    );
  }
}
