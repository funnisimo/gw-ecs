export class Aspect {
  private allComponents: string[];
  private oneComponents: string[][];
  private someComponents: string[][];
  private noneComponents: string[];

  public constructor() {
    this.allComponents = [];
    this.oneComponents = [];
    this.noneComponents = [];
    this.someComponents = [];
  }

  public accept(components: string[]): boolean {
    return (
      this.checkAll(components) &&
      this.checkOne(components) &&
      this.checkSome(components) &&
      this.checkNone(components)
    );
  }

  public all(...components: string[]): Aspect {
    this.allComponents = this.allComponents.concat(components);
    return this;
  }

  public one(...components: string[]): Aspect {
    if (components.length == 0) return this;
    this.oneComponents.push(components);
    return this;
  }

  public some(...components: string[]): Aspect {
    if (components.length == 0) return this;
    this.someComponents.push(components);
    return this;
  }

  public none(...components: string[]): Aspect {
    this.noneComponents = this.noneComponents.concat(components);
    return this;
  }

  private checkAll(components: string[]) {
    return (
      this.allComponents.length === 0 ||
      this.allComponents.every((componentName: string) =>
        components.includes(componentName)
      )
    );
  }

  private checkOne(components: string[]) {
    return (
      this.oneComponents.length === 0 ||
      this.oneComponents.every((set: string[]) => {
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

  private checkSome(components: string[]): boolean {
    return (
      this.someComponents.length === 0 ||
      this.someComponents.some((set: string[]): boolean => {
        return (
          set.length == 0 ||
          set.some((componentName: string) =>
            components.includes(componentName)
          )
        );
      })
    );
  }

  private checkNone(components: string[]) {
    return (
      this.noneComponents.length === 0 ||
      this.noneComponents.every(
        (componentName: string) => !components.includes(componentName)
      )
    );
  }
}
