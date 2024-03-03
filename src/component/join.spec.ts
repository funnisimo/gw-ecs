import "jest-extended";
import { join } from "./join";
import { World } from "../world";

class A {}
class B {}

describe("join", () => {
  test("join 2 managers", () => {
    const world = new World();
    world.registerComponent(A).registerComponent(B);
    world.init();

    const e1 = world.create();
    const e2 = world.create();
    const e3 = world.create();

    const a = new A();
    e1.add(a);
    e2.add(new A());

    const b = new B();
    e1.add(b);
    e3.add(new B());

    // 1 = A + B
    // 2 = A
    // 3 = B

    expect([...join(world, A, B)]).toEqual([[e1, [a, b]]]);
  });
});
