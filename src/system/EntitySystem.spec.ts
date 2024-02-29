import "jest-extended";
import { Aspect, World, EntitySystem } from "../index";

describe("entity system", () => {
  class MyEntitySytem extends EntitySystem {
    constructor(aspect: Aspect) {
      super(aspect);
    }

    protected process(_entity: number): void {}
  }

  it("use its aspect to check whether an entity match or not", () => {
    let aspectA = new Aspect().all("A").one("B");
    let aspectB = new Aspect().one("B").none("C");
    let systemA = new MyEntitySytem(aspectA);
    let systemB = new MyEntitySytem(aspectB);

    let world = new World();
    world
      // .addSystem(systemA)
      // .addSystem(systemB)
      .init();

    let entity = world.create();

    expect(systemA.accept(entity, ["A"])).toBeFalse();
    expect(systemA.accept(entity, ["A", "B"])).toBeTrue();
    expect(systemA.accept(entity, ["B"])).toBeFalse();
    expect(systemA.accept(entity, ["A", "C"])).toBeFalse();

    expect(systemB.accept(entity, ["A"])).toBeFalse();
    expect(systemB.accept(entity, ["A", "B"])).toBeTrue();
    expect(systemB.accept(entity, ["B"])).toBeTrue();
    expect(systemB.accept(entity, ["B", "C"])).toBeFalse();
  });
});
