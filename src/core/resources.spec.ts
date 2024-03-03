import "jest-extended";
import { Resources } from "./resources";

class A {}
// class B {}
// class C {}

describe("Resources", () => {
  test("add/remove resources", () => {
    const resources = new Resources();
    const a = new A();
    resources.set(a);
    expect(resources.get(A)).toBe(a);

    const a2 = new A();
    resources.set(a2);
    expect(resources.get(A)).toBe(a2);

    resources.delete(A);
    expect(resources.get(A)).toBeUndefined();
  });
});
