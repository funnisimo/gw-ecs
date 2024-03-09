export interface Queue<T> extends Function {
  new (...args: any[]): T;
}

export type AnyQueue = Queue<any>;

export class QueueReader<T> {
  _store: QueueStore<T>;
  _nextIndex = 0;

  constructor(store: QueueStore<T>, onlyNew = false) {
    this._store = store;
    this._nextIndex = onlyNew ? store.nextIndex : store.firstIndex;
  }

  hasMore(): boolean {
    return this._store.nextIndex > this._nextIndex;
  }

  next(): T | undefined {
    const item = this._store.get(this._nextIndex);
    if (item) {
      this._nextIndex += 1;
    }
    return item;
  }

  forEach(fn: (t: T) => void) {
    let next = this.next();
    while (next) {
      fn(next);
      next = this.next();
    }
  }
}

export class QueueStore<T> {
  _queue: Queue<T>;
  _a: T[];
  _aIndex: number;
  _b: T[];
  _bIndex: number;

  constructor(queue: Queue<T>) {
    this._queue = queue;
    this._a = [];
    this._b = [];
    this._aIndex = 0;
    this._bIndex = 0;
  }

  get firstIndex(): number {
    return this._aIndex;
  }
  get nextIndex(): number {
    return this._bIndex + this._b.length;
  }

  push(item: T) {
    this._b.push(item);
  }

  get(index: number): T | undefined {
    if (index < this._aIndex) return undefined;
    if (index < this._bIndex) {
      return this._a[index - this._aIndex];
    }
    return this._b[index - this._bIndex];
  }

  reader(onlyNew = false): QueueReader<T> {
    return new QueueReader<T>(this, onlyNew);
  }

  maintain() {
    if (this._b.length) {
      this._a = this._b;
      this._aIndex = this._bIndex;
      this._bIndex += this._b.length;
      this._b = [];
    }
  }
}

export type AnyQueueStore = QueueStore<any>;

export class QueueManager {
  private queues: Map<AnyQueue, AnyQueueStore>;

  constructor() {
    this.queues = new Map();
  }

  register<T>(comp: Queue<T>): void {
    if (this.queues.get(comp)) return;
    const store = new QueueStore(comp);
    this.queues.set(comp, store);
  }

  getStore<T>(comp: Queue<T>): QueueStore<T> | undefined {
    do {
      const store = this.queues.get(comp);
      if (store) return store;
      comp = Object.getPrototypeOf(comp);
    } while (comp && !comp.isPrototypeOf(Object));
  }

  maintain() {
    this.queues.forEach((store) => store.maintain());
  }
}
