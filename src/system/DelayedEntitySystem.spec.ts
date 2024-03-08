import "jest-extended";
import { Aspect, World } from "../world";
import { Entity } from "../entity";
import { DelayedEntitySystem } from "./delayedEntitySystem";

describe("delayed entity system", () => {
  class MyDelayedEntitySystem extends DelayedEntitySystem {
    private fakeCallback: jest.Func;

    constructor(callback: jest.Func, delay: number, aspect: Aspect) {
      super(aspect, delay);
      this.fakeCallback = callback;
    }

    public processEntity(_world: World, entity: Entity): void {
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
      new Aspect().with(A)
    );

    world.registerComponent(A).addSystem(myDelayedEntitySystem).start();

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
