import { System } from "./system";

export abstract class IntervalSystem extends System {
  protected delay: number;
  protected interval: number;
  private catchUp: boolean = true;

  public constructor(runEvery: number, startIn?: number) {
    super();
    this.interval = runEvery;
    this.delay = startIn === undefined ? runEvery : startIn;
  }

  protected updateDelay() {
    this.delay -= this.world.delta;
  }

  public enableCatchUpDelay(catchUp: boolean): void {
    this.catchUp = catchUp;
  }

  public process(): void {
    if (this.isEnabled()) {
      this.updateDelay();
      if (this.delay <= 0) {
        this.beforeProcess();
        this.doProcess();
        this.afterProcess();
        if (this.interval == 0) {
          this.setEnabled(false);
        } else {
          this.delay += this.interval;
          // TODO - there is a way to do this without the loop
          while (this.delay < 0 && !this.catchUp) {
            this.delay += this.interval;
          }
        }
      }
    }
  }
}
