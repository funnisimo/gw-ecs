import "jest-extended";
import { QueueManager, QueueStore } from "./queue";

describe("queue", () => {
  class A {
    id: string;
    constructor(id: string = "a") {
      this.id = id;
    }
  }
  class B extends A {}

  describe("QueueStore", () => {
    test("push, get", () => {
      const store = new QueueStore(A);

      expect(store.nextIndex).toEqual(0);
      expect(store.get(0)).toBeUndefined();
      store.push(new A("a"));
      expect(store.nextIndex).toEqual(1);
      expect(store.get(0)).toEqual(new A("a"));
      expect(store.get(1)).toBeUndefined();
    });

    test("maintain", () => {
      const store = new QueueStore(A);

      store.push(new A("0"));
      store.push(new A("1"));
      expect(store.firstIndex).toEqual(0);
      expect(store.nextIndex).toEqual(2);
      store.maintain();
      expect(store.firstIndex).toEqual(0);
      expect(store.nextIndex).toEqual(2);
      expect(store.get(0)).not.toBeUndefined();
      expect(store.get(1)).not.toBeUndefined();
      store.push(new A("2"));
      store.push(new A("3"));
      expect(store.firstIndex).toEqual(0);
      expect(store.nextIndex).toEqual(4);
      expect(store.get(0)).not.toBeUndefined();
      expect(store.get(1)).not.toBeUndefined();
      expect(store.get(2)).not.toBeUndefined();
      expect(store.get(3)).not.toBeUndefined();

      // Maintain swaps buffers
      store.maintain();
      expect(store.firstIndex).toEqual(2);
      expect(store.nextIndex).toEqual(4);
      expect(store.get(0)).toBeUndefined();
      expect(store.get(1)).toBeUndefined();
      expect(store.get(2)).not.toBeUndefined();
      expect(store.get(3)).not.toBeUndefined();

      // If maintain, but no new entries, nothing happens
      store.maintain();
      expect(store.firstIndex).toEqual(2);
      expect(store.nextIndex).toEqual(4);
      expect(store.get(0)).toBeUndefined();
      expect(store.get(1)).toBeUndefined();
      expect(store.get(2)).not.toBeUndefined();
      expect(store.get(3)).not.toBeUndefined();
    });
  });

  describe("QueueReader", () => {
    test("basic", () => {
      const store = new QueueStore(A);

      store.push(new A("0"));
      store.push(new A("1"));

      const reader = store.reader();
      expect(reader.hasMore()).toBeTrue();
      expect(reader.next()).not.toBeUndefined();
      expect(reader.next()).not.toBeUndefined();
      expect(reader.next()).toBeUndefined();
      expect(reader.hasMore()).toBeFalse();

      store.push(new A("2"));
      expect(reader.next()).not.toBeUndefined();
      expect(reader.next()).toBeUndefined();
      expect(reader.hasMore()).toBeFalse();
    });

    test("onlyNew", () => {
      const store = new QueueStore(A);

      store.push(new A("0"));
      store.push(new A("1"));

      const reader = store.reader(true);
      expect(reader.hasMore()).toBeFalse();
      expect(reader.next()).toBeUndefined();
      expect(reader.hasMore()).toBeFalse();

      store.push(new A("2"));
      expect(reader.next()).not.toBeUndefined();
      expect(reader.next()).toBeUndefined();
      expect(reader.hasMore()).toBeFalse();
    });
  });

  describe("QueueManager", () => {
    test("register/get", () => {
      const manager = new QueueManager();
      manager.register(A);
      const store = manager.getStore(A)!;
      store.push(new A());
      expect(store.nextIndex).toEqual(1);

      const storeB = manager.getStore(B)!;
      expect(storeB).toBe(store);

      storeB.push(new B());

      expect(storeB.nextIndex).toEqual(2);
      expect(store.nextIndex).toEqual(2);
    });
  });
});
