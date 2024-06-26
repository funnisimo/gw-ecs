import "jest-extended";
import { WorldEntities, ComponentSource, Entity } from "./entity";

class CompA {
  data: number;

  constructor(data = 1) {
    this.data = data;
  }
}

describe("Entity", () => {
  let setComponent: jest.Mock;
  let removeComponent: jest.Mock;
  let getTick: jest.Mock;
  let entities: WorldEntities;
  let source: ComponentSource;

  beforeEach(() => {
    getTick = jest.fn().mockReturnValue(1);
    setComponent = jest
      .fn()
      .mockImplementation((e, v, c) => e._setComp(c, v, 1));
    removeComponent = jest
      .fn()
      .mockImplementation((e, c) => e._removeComp(c, 1));

    source = {
      getTick,
      setComponent,
      removeComponent,
    };

    entities = new WorldEntities(source);
  });

  test("stand alone", () => {
    const entity = new Entity(1);
    entity.set(new CompA());
    expect(entity.has(CompA)).toBeTrue();
    expect(entity.fetch(CompA)!.data).toEqual(1);
    entity.remove(CompA);
    expect(entity.has(CompA)).toBeFalse();
    expect(entity.fetch(CompA)).toBeUndefined();
  });

  test("basics", () => {
    const e = entities.create();
    expect(e).toBeObject();
    expect(e.isAlive()).toBeTrue();
    expect(e.index).toEqual(0);
    expect(e.gen).toEqual(1);
    expect(e.has(CompA)).toBeFalse();

    expect(e.has(CompA)).toBeFalse();
    expect(e.fetch(CompA)).toBeUndefined();

    const a = new CompA();
    expect(e.set(a)).toBeUndefined();
    expect(setComponent).toHaveBeenCalledWith(e, a, CompA);
    setComponent.mockClear();

    expect(e.has(CompA)).toBeTrue();
    expect(e.fetch(CompA)).toBe(a);

    const a2 = new CompA(2);
    expect(e.set(a2)).toBeUndefined();
    expect(e.has(CompA)).toBeTrue();
    expect(e.fetch(CompA)).toEqual(a2);

    expect(e.has(CompA)).toBeTrue();

    expect(e.remove(CompA)).toBe(a2);
    expect(removeComponent).toHaveBeenCalledWith(e, CompA);
    removeComponent.mockClear();
    expect(e.fetch(CompA)).toBeUndefined();
    expect(e.remove(CompA)).toBeUndefined(); // Already removed
    expect(removeComponent).toHaveBeenCalledWith(e, CompA); // But we still ask to remove the component anyway to be safe
    removeComponent.mockClear();

    expect(e.has(CompA)).toBeFalse();
  });

  test("life cycle", () => {
    const e = entities.create();

    expect(e.isAlive()).toBeTrue();
    expect(e.gen).toEqual(1);
    e.set(new CompA());

    entities.destroy(e); // Done by world, managers
    expect(e.isAlive()).toBeFalse();
    expect(e.has(CompA)).toBeFalse();
    // expect(removeComponent).toHaveBeenCalledWith(e, CompA);

    // removeComponent.mockClear();
    const e2 = entities.create();
    expect(e2).not.toBe(e);
    expect(e2.index).toEqual(e.index);
    expect(e2.gen).toEqual(2);
    expect(e2.isAlive()).toBeTrue();
    expect(e2.has(CompA)).toBeFalse();
    e2.set(new CompA());
    expect(e2.has(CompA)).toBeTrue();

    entities.destroy(e2); // Done by world
    expect(e2.isAlive()).toBeFalse();
    expect(e2.has(CompA)).toBeFalse();
    // expect(removeComponent).toHaveBeenCalled();
  });
});
