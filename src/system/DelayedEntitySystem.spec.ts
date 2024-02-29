import "jest-extended";
import { World, Aspect, Component } from "../core";
import { DelayedEntitySystem } from "./DelayedEntitySystem";

describe("delayed entity system", () => {
  class MyDelayedEntitySystem extends DelayedEntitySystem {
    private fakeCallback: jest.Func;

    constructor(callback: jest.Func) {
      super(new Aspect().all("Timer").none("Executed"));
      this.fakeCallback = callback;
    }

    public init(world: World) {
      super.init(world);
    }

    public updateEntityDelay(entity: number): boolean {
      let manager = this.world.getComponentManager("Timer");
      let timer = manager.fetch(entity) as Timer;
      if (timer.timeBeforeProcess < 0) return false; // Hmmmm.....
      timer.timeBeforeProcess -= this.world.delta;
      return timer.timeBeforeProcess <= 0;
    }

    public process(entity: number): void {
      this.fakeCallback(entity);
    }
  }

  class Timer extends Component {
    public timeBeforeProcess = 10;

    constructor(timer: number) {
      super();
      this.timeBeforeProcess = timer;
    }

    reset(delay: number) {
      this.timeBeforeProcess = delay;
    }
  }

  it("should not be process if disabled", () => {
    let world = new World();
    let fakeCallback = jest.fn();
    let myDelayedEntitySystem = new MyDelayedEntitySystem(fakeCallback);

    world
      .registerComponent("Timer", new Timer(10))
      .addSystem(myDelayedEntitySystem)
      .init();

    let entity = world.create();
    let entityTimer = world.getComponentManager("Timer").fetch(entity) as Timer;

    expect(entityTimer.timeBeforeProcess).toEqual(10);

    world.process(5);
    expect(entityTimer.timeBeforeProcess).toEqual(5);
    expect(fakeCallback).not.toHaveBeenCalled();

    myDelayedEntitySystem.setEnable(false);
    world.process(10);
    expect(entityTimer.timeBeforeProcess).toEqual(5);
    expect(fakeCallback).not.toHaveBeenCalled();

    myDelayedEntitySystem.setEnable(true);
    world.process(5);
    expect(entityTimer.timeBeforeProcess).toEqual(0);
    expect(fakeCallback).toHaveBeenCalledWith(entity);
  });

  it("should process entity once after a certain time", () => {
    let world = new World();
    let fakeCallback = jest.fn();
    let myDelayedEntitySystem = new MyDelayedEntitySystem(fakeCallback);

    world
      .registerComponent("Timer", new Timer(10))
      .addSystem(myDelayedEntitySystem)
      .init();

    let entityA = world.create();
    let entityB = world.create();
    world.getComponentManager("Timer").add(entityA, new Timer(10));
    world.getComponentManager("Timer").add(entityB, new Timer(20));

    world.process(5);
    expect(fakeCallback).not.toHaveBeenCalled();

    fakeCallback.mockClear();
    world.process(10);
    expect(fakeCallback).toHaveBeenCalledWith(entityA);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityB);

    fakeCallback.mockClear();
    world.process(10);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityA);
    expect(fakeCallback).toHaveBeenCalledWith(entityB);

    fakeCallback.mockClear();
    world.process(10);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityA);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityB);

    const timers = world.getComponentManager("Timer");
    const timeA = timers.fetch(entityA) as Timer;
    timeA.reset(20);

    fakeCallback.mockClear();
    world.process(19);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityA);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityB);

    fakeCallback.mockClear();
    world.process(1);
    expect(fakeCallback).toHaveBeenCalledWith(entityA);
    expect(fakeCallback).not.toHaveBeenCalledWith(entityB);
  });
});
