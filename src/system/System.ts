import { Entity } from "../entity";
import { World } from "../world";

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

  rebase(zeroTime: number) {
    this.lastTick = Math.max(0, this.lastTick - zeroTime);
  }

  setEnabled(enable: boolean) {
    this.enabled = enable;
  }

  isEnabled() {
    return this.enabled;
  }

  // TODO - params? => time: number, delta: number, currentTick: number
  process(): void {
    if (this.isEnabled()) {
      this.beforeProcess();
      this.doProcess();
      this.afterProcess();
    }
    this.lastTick = this.world.currentTick();
  }

  /* tslint:disable:no-empty */
  protected beforeProcess(): void {}

  // TODO - params => time: number, delta: number
  protected abstract doProcess(): void;

  /* tslint:disable:no-empty */
  protected afterProcess(): void {}

  destroyEntities(entities: Entity[]): void {
    entities.forEach((e) => this.destroyEntity(e));
  }

  /* tslint:disable:no-empty */
  destroyEntity(_entity: Entity) {}
}
