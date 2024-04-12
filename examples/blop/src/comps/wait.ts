export class Wait {
  queueGameEvent: boolean;

  constructor(queueGameEvent = true) {
    this.queueGameEvent = queueGameEvent;
  }
}

export class TakeTurn extends Wait {
  constructor() {
    super(false);
  }
}
