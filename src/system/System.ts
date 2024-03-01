import { Entity, World } from "../core";

export abstract class System {
  protected world: World;
  private enabled: boolean = true;
  lastTick = 0;

  constructor() {
    this.enabled = true;
    this.world = new World();
  }

  init(world: World) {
    this.world = world;
  }

  setEnabled(enable: boolean) {
    this.enabled = enable;
  }

  isEnabled() {
    return this.enabled;
  }

  // // TODO - Remove?
  // accept(_entity: Entity, _components: AnyComponent[]): boolean {
  //   return false;
  // }

  // TODO - Remove?
  /* tslint:disable:no-empty */
  removeEntities(_entities: Entity[]): void {}

  process(): void {
    if (this.isEnabled()) {
      this.beforeProcess();
      this.doProcess();
      this.afterProcess();
    }
    this.lastTick = this.world.currentTick();
  }

  /* tslint:disable:no-empty */
  beforeProcess(): void {}

  protected abstract doProcess(): void;

  /* tslint:disable:no-empty */
  afterProcess(): void {}
}
