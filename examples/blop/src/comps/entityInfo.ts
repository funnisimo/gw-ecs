import { Aspect } from "gw-ecs/world";
import { fl, from, type FlagBase } from "gw-utils/flag";

export enum EntityFlags {
  ALWAYS_INTERRUPT = fl(0),
  INTERRUPT_WHEN_SEEN = fl(1),
  SEEN = fl(2),
}

export class EntityInfo {
  flags: EntityFlags;

  constructor(flags: FlagBase) {
    this.flags = from(EntityFlags, flags);
  }

  // TODO - Should you be able to turn this off?
  //      - like turn it off if you see it the first time?
  shouldInterruptWhenSeen(): boolean {
    if ((this.flags & EntityFlags.INTERRUPT_WHEN_SEEN) > 0) {
      return (this.flags & EntityFlags.SEEN) == 0;
    }
    return (this.flags & EntityFlags.ALWAYS_INTERRUPT) > 0;
  }

  seen() {
    this.flags |= EntityFlags.SEEN;
  }
}

export const ENTITY_INFO_ASPECT = new Aspect(EntityInfo);
