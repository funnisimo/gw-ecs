import "jest-extended";
import { Entities, ComponentSource } from "./entity";

class CompA {
  data: number;

  constructor(data = 1) {
    this.data = data;
  }
}

describe("Entity", () => {
  let fetch: jest.Mock;
  let addComponent: jest.Mock;
  let removeComponent: jest.Mock;
  let entities: Entities;
  let source: ComponentSource;

  beforeEach(() => {
    fetch = jest.fn();
    addComponent = jest.fn();
    removeComponent = jest.fn();

    source = {
      fetch,
      addComponent,
      removeComponent,
    };

    entities = new Entities(source);
  });

  test("basics", () => {
    const e = entities.create();
    expect(e).toBeObject();
    expect(e.isAlive()).toBeTrue();
    expect(e._index).toEqual(0);
    expect(e._gen).toEqual(1);
    expect(e.allComponents()).toEqual([]);

    expect(e.has(CompA)).toBeFalse();
    expect(e.fetch(CompA)).toBeUndefined();
    expect(source.fetch).toHaveBeenCalledWith(CompA, e);
    fetch.mockClear();

    const a = new CompA();
    expect(e.add(CompA, a)).toBeTrue();
    expect(addComponent).toHaveBeenCalledWith(CompA, e, a);
    addComponent.mockClear();

    expect(e.has(CompA)).toBeTrue();
    fetch.mockReturnValueOnce(a);
    expect(e.fetch(CompA)).toBe(a);
    expect(source.fetch).toHaveBeenCalledWith(CompA, e);
    fetch.mockClear();

    const a2 = new CompA(2);
    expect(e.add(CompA, a2)).toBeFalse(); // Not a new component
    expect(e.has(CompA)).toBeTrue();
    fetch.mockReturnValueOnce(a2);
    expect(e.fetch(CompA)).toEqual(a2);
    expect(source.fetch).toHaveBeenCalledWith(CompA, e);
    fetch.mockClear();

    expect(e.allComponents()).toEqual([CompA]); // TODO - keep constructors instead of names?

    expect(e.remove(CompA)).toBeTrue();
    expect(removeComponent).toHaveBeenCalledWith(CompA, e);
    removeComponent.mockClear();
    expect(e.remove(CompA)).toBeFalse(); // Already removed
    expect(removeComponent).toHaveBeenCalledWith(CompA, e); // But we still ask to remove the component anyway to be safe
    removeComponent.mockClear();

    expect(e.allComponents()).toEqual([]);

    expect(e.has(CompA)).toBeFalse();
  });

  test("life cycle", () => {
    const e = entities.create();

    expect(e.isAlive()).toBeTrue();
    expect(e._gen).toEqual(1);
    e.add(CompA, new CompA());

    entities.queueDestroy(e);
    expect(e.isAlive()).toBeTrue();
    expect(e.has(CompA)).toBeTrue();
    expect(removeComponent).not.toHaveBeenCalled();
    entities.process();
    expect(e.isAlive()).toBeFalse();
    expect(e.has(CompA)).toBeFalse();
    expect(removeComponent).toHaveBeenCalled();

    removeComponent.mockClear();
    const e2 = entities.create();
    expect(e2).toBe(e);
    expect(e2._gen).toEqual(2);
    expect(e2.isAlive()).toBeTrue();
    expect(e2.allComponents()).toEqual([]);
    e2.add(CompA, new CompA());

    entities.destroyNow(e2);
    expect(e.isAlive()).toBeFalse();
    expect(e.has(CompA)).toBeFalse();
    expect(removeComponent).toHaveBeenCalled();
  });
});
