import "jest-extended";
import { MultiWorld } from "./multiWorld";
import { Level } from "./level";

class A {}
class B {}
class C {}

describe("multiWorld", () => {
  test("add levels", () => {
    const world = new MultiWorld()
      .registerComponent(A)
      .registerQueue(B)
      .createLevel("a", (level) => {
        level.registerComponent(C); // This is in 'a', but not 'b'
      })
      .addLevel(new Level("b"))
      .activateLevel("a")
      .start();

    world.create(new A());

    const level = world.getLevel("a")!;
    expect(level.getStore(C)).toBeObject();
    const reader = level.getReader(B);

    expect(reader.hasMore()).toBeFalse();
    level!.pushQueue(new B());
    expect(reader.hasMore()).toBeTrue();

    // TODO - Is throwing right?
    expect(() => world.getLevel("b")!.getStore(C)).toThrow();
  });

  test.todo("move entity to new level");
});
