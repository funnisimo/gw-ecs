import { Entity } from "../entity/entity.js";
import { Aspect, World } from "../world/index.js";
import { AnyComponent } from "./component.js";

export function join(
  world: World,
  ...comps: AnyComponent[]
): Iterable<[Entity, AnyComponent[]]> {
  const aspect = new Aspect().with(...comps);
  return aspect.allEntries(world);
}
