import { Aspect, Entity } from "gw-ecs/entity";
import { fl, from, type FlagBase } from "gw-utils/flag";
import { Sprite } from "./sprite";

export enum EntityFlags {
  ALWAYS_INTERRUPT = fl(0),
  INTERRUPT_WHEN_SEEN = fl(1),
  SEEN = fl(2),
  OBSERVE = fl(3),
}

export class EntityInfo {
  name: string;
  flags: EntityFlags;

  constructor(name: string, flags: FlagBase = 0) {
    this.name = name;
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

  hasFlag(flag: EntityFlags): boolean {
    return (this.flags & flag) > 0;
  }
}

export const ENTITY_INFO_ASPECT = new Aspect(EntityInfo);

export function coloredName(entity: Entity): string {
  let sprite = entity.fetch(Sprite) || { fg: "white" };
  let name = entity.fetch(EntityInfo);

  if (!name) return `#{${sprite.fg} Entity}`;

  // other items: powerup + heal + add dna slot + ...
  return `#{${sprite.fg} ${name.name}}`;
}
