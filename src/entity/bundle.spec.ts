import "jest-extended";
import { World } from "../world";
import { Bundle } from "./bundle";

describe("bundle", () => {
  class A {}
  class B {}
  class C {}

  test("create with component instance", () => {
    const world = new World().registerComponent(A);
    const a = new A();
    const bundle = new Bundle(a);

    const entity = bundle.create(world);
    expect(entity.has(A)).toBeTrue();
  });

  test("create with component class", () => {
    const world = new World().registerComponent(A);
    const bundle = new Bundle(A); // creates one

    const entity = bundle.create(world);
    expect(entity.has(A)).toBeTrue();
  });

  test("create with create fn", () => {
    const world = new World().registerComponent(A);
    const bundle = new Bundle(() => new A());

    const entity = bundle.create(world);
    expect(entity.has(A)).toBeTrue();
  });

  test("from object", () => {
    const world = new World().registerComponent(A);
    const bundle = Bundle.fromObject({ name: new A() });

    const entity = bundle.create(world);
    expect(entity.has(A)).toBeTrue();
  });

  test("multiple components and types", () => {
    const world = new World().registerComponents(A, B, C);
    const bundle = new Bundle(new A(), B, () => new C());

    const entity = bundle.create(world);
    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();
    expect(entity.has(C)).toBeTrue();
  });

  test("from object with multiple components and types", () => {
    const world = new World().registerComponents(A, B, C);
    const bundle = Bundle.fromObject({
      name: new A(),
      address: B,
      group: () => new C(),
    });

    const entity = bundle.create(world);
    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();
    expect(entity.has(C)).toBeTrue();
  });

  test("world.create", () => {
    const world = new World().registerComponents(A, B, C);
    const bundle = new Bundle(new A(), B, () => new C());

    const entity = world.create(bundle);
    expect(entity.has(A)).toBeTrue();
    expect(entity.has(B)).toBeTrue();
    expect(entity.has(C)).toBeTrue();
  });
});
