import { RunIfFn, System } from "../system";
import { World } from "../world";

export class RunSetSystem extends System {
  set: string;

  constructor(set: string, runIf?: RunIfFn) {
    super(runIf);
    this.set = set;
  }

  run(world: World, time: number, delta: number): void {
    world.runSystemSet(this.set, time, delta);
  }
}
