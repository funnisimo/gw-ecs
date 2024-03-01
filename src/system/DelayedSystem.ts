import { System } from "./system";

export abstract class DelayedSystem extends System {
  protected delay: number;

  public constructor(delay: number) {
    super();
    this.delay = delay;
  }

  protected updateDelay() {
    this.delay -= this.world.delta;
  }

  public process(): void {
    if (this.isEnabled()) {
      this.updateDelay();
      if (this.delay <= 0) {
        this.beforeProcess();
        this.doProcess();
        this.afterProcess();
        this.delay = 0;
        this.setEnabled(false);
      }
    }
  }

  public runIn(delay: number) {
    this.delay = delay;
    this.setEnabled(true);
  }

  protected abstract doProcess(): void;
}
