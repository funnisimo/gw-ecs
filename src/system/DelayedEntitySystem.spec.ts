import "jest-extended";
import { World, Aspect, Entity } from "../core";
import { DelayedEntitySystem } from "./delayedEntitySystem";

describe("delayed entity system", () => {
  class MyDelayedEntitySystem extends DelayedEntitySystem {
    private fakeCallback: jest.Func;

    constructor(callback: jest.Func, delay: number, aspect: Aspect) {
      super(aspect, delay);
      this.fakeCallback = callback;
    }

    public init(world: World) {
      super.init(world);
    }

    // public updateEntityDelay(entity: Entity): boolean {
    //   let manager = this.world.getComponentManager(Timer);
    //   let timer = manager.fetch(entity)!;
    //   if (timer.timeBeforeProcess < 0) return false; // Hmmmm.....
    //   timer.timeBeforeProcess -= this.world.delta;
    //   return timer.timeBeforeProcess <= 0;
    // }

    public processEntity(entity: Entity): void {
      this.fakeCallback(entity);
    }
  }

  class A {}

  it("should not be process if disabled", () => {
    let world = new World();
    let fakeCallback = jest.fn();
    let myDelayedEntitySystem = new MyDelayedEntitySystem(
      fakeCallback,
      10,
      new Aspect().all(A)
    );

    world.registerComponent(A).addSystem(myDelayedEntitySystem).init();

    let entity = world.create();
    entity.add(new A());

    world.process(5);
    expect(fakeCallback).not.toHaveBeenCalled();

    let entity2 = world.create();
    entity2.add(new A());

    myDelayedEntitySystem.setEnabled(false);
    world.process(10);
    expect(fakeCallback).not.toHaveBeenCalled();

    myDelayedEntitySystem.setEnabled(true);
    world.process(5);
    expect(fakeCallback).toHaveBeenCalledTimes(2); // Delay is for system, not per entity
    expect(fakeCallback).toHaveBeenCalledWith(entity);
    expect(fakeCallback).toHaveBeenCalledWith(entity2);
  });
});
