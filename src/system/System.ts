import { World } from "../core";

export abstract class System {
  protected world: World;
  private enable: boolean = true;

  constructor() {
    this.enable = true;
    this.world = new World();
  }

  init(world: World) {
    this.world = world;
  }

  setEnable(enable: boolean) {
    this.enable = enable;
  }

  isEnable() {
    return this.enable;
  }

  accept(_entity: number, _components: string[]): boolean {
    return false;
  }

  /* tslint:disable:no-empty */
  removeEntities(_entities: number[]): void {}

  doProcessSystem(): void {
    if (this.isEnable()) {
      this.beforeProcess();
      this.processSystem();
      this.afterProcess();
    }
  }

  /* tslint:disable:no-empty */
  protected beforeProcess(): void {}

  protected abstract processSystem(): void;

  /* tslint:disable:no-empty */
  protected afterProcess(): void {}
}
