import "jest-extended";
import { Schedule } from "./schedule.js";
import { SystemFn } from "../system/system.js";

describe("schedule", () => {
  test("a, b, a, b, ...", () => {
    const sched = new Schedule();

    const a = jest.fn().mockImplementation(() => sched.add(a, 100));
    const b = jest.fn().mockImplementation(() => sched.add(b, 100));

    sched.add(a, 100);
    sched.add(b, 100);

    let n = sched.pop() as SystemFn;
    expect(n).toBe(a);
    expect(sched.time).toEqual(100);
    // @ts-ignore
    n();

    n = sched.pop() as SystemFn;
    expect(n).toBe(b);
    expect(sched.time).toEqual(100);
    // @ts-ignore
    n();

    n = sched.pop() as SystemFn;
    expect(n).toBe(a);
    expect(sched.time).toEqual(200);
    // @ts-ignore
    n();

    n = sched.pop() as SystemFn;
    expect(n).toBe(b);
    expect(sched.time).toEqual(200);
    // @ts-ignore
    n();
  });

  test("a, a!, b, a, a!, b, ...", () => {
    const sched = new Schedule();

    const a = jest.fn();
    const b = jest.fn();

    sched.add(a, 100);
    sched.add(b, 100);

    let n = sched.pop() as SystemFn;
    expect(n).toBe(a);
    expect(sched.time).toEqual(100);
    sched.restore(n);
    expect(sched.time).toEqual(100);

    n = sched.pop() as SystemFn;
    expect(n).toBe(a);
    expect(sched.time).toEqual(100);
    sched.add(n, 100);
    expect(sched.time).toEqual(100);

    n = sched.pop() as SystemFn;
    expect(n).toBe(b);
    expect(sched.time).toEqual(100);
    sched.add(n, 100);

    n = sched.pop() as SystemFn;
    expect(n).toBe(a);
    expect(sched.time).toEqual(200);
    sched.restore(n);

    n = sched.pop() as SystemFn;
    expect(n).toBe(a);
    expect(sched.time).toEqual(200);
    sched.add(n, 100);

    n = sched.pop() as SystemFn;
    expect(n).toBe(b);
  });
});
