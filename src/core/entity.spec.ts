import "jest-extended";
import { Entities, ComponentSource } from "./entity";

class CompA {
  data: number;

  constructor(data = 1) {
    this.data = data;
  }
}

describe("Entity", () => {
  let fetchComponent: jest.Mock;
  let updateComponent: jest.Mock;
  let addComponent: jest.Mock;
  let removeComponent: jest.Mock;
  let currentTick: jest.Mock;
  let entities: Entities;
  let source: ComponentSource;

  beforeEach(() => {
    currentTick = jest.fn().mockReturnValue(1);
    fetchComponent = jest.fn();
    updateComponent = jest.fn();
    addComponent = jest.fn().mockImplementation((e, _v, c) => e._addComp(c));
    removeComponent = jest.fn().mockImplementation((e, c) => e._removeComp(c));

    source = {
      currentTick,
      fetchComponent,
      updateComponent,
      addComponent,
      removeComponent,
    };

    entities = new Entities(source);
  });

  test("basics", () => {
    const e = entities.create();
    expect(e).toBeObject();
    expect(e.isAlive()).toBeTrue();
    expect(e.id.index).toEqual(0);
    expect(e.id.gen).toEqual(1);
    expect(e.has(CompA)).toBeFalse();

    expect(e.has(CompA)).toBeFalse();
    expect(e.fetch(CompA)).toBeUndefined();
    expect(source.fetchComponent).toHaveBeenCalledWith(e, CompA);
    fetchComponent.mockClear();

    const a = new CompA();
    expect(e.add(a)).toBeUndefined(); // No prior value
    expect(addComponent).toHaveBeenCalledWith(e, a, CompA);
    addComponent.mockClear();

    expect(e.has(CompA)).toBeTrue();
    fetchComponent.mockReturnValueOnce(a);
    expect(e.fetch(CompA)).toBe(a);
    expect(source.fetchComponent).toHaveBeenCalledWith(e, CompA);
    fetchComponent.mockClear();

    const a2 = new CompA(2);
    expect(e.add(a2)).toBeUndefined(); // No prior value
    expect(e.has(CompA)).toBeTrue();
    fetchComponent.mockReturnValueOnce(a2);
    expect(e.fetch(CompA)).toEqual(a2);
    expect(source.fetchComponent).toHaveBeenCalledWith(e, CompA);
    fetchComponent.mockClear();

    expect(e.has(CompA)).toBeTrue();

    expect(e.remove(CompA)).toBeUndefined(); // TODO - If using World will be 'a2'
    expect(removeComponent).toHaveBeenCalledWith(e, CompA);
    removeComponent.mockClear();
    expect(e.remove(CompA)).toBeUndefined(); // Already removed
    expect(removeComponent).toHaveBeenCalledWith(e, CompA); // But we still ask to remove the component anyway to be safe
    removeComponent.mockClear();

    expect(e.has(CompA)).toBeFalse();
  });

  test("life cycle", () => {
    const e = entities.create();

    expect(e.isAlive()).toBeTrue();
    expect(e.id.gen).toEqual(1);
    e.add(new CompA());

    e._destroy(); // Done by world, managers
    expect(e.isAlive()).toBeFalse();
    expect(e.has(CompA)).toBeFalse();
    expect(removeComponent).toHaveBeenCalledWith(e, CompA);

    removeComponent.mockClear();
    const e2 = entities.create();
    expect(e2).toBe(e);
    expect(e2.id.gen).toEqual(2);
    expect(e2.isAlive()).toBeTrue();
    expect(e2.has(CompA)).toBeFalse();
    e2.add(new CompA());
    expect(e2.has(CompA)).toBeTrue();

    e2._destroy(); // Done by world
    expect(e2.isAlive()).toBeFalse();
    expect(e2.has(CompA)).toBeFalse();
    expect(removeComponent).toHaveBeenCalled();
  });
});
