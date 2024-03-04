import { Entity } from "../entity/entity.js";
import { Aspect, World } from "../world/index.js";
import { AnyComponent } from "./component.js";

export function join(
  world: World,
  ...comps: AnyComponent[]
): Iterable<[Entity, AnyComponent[]]> {
  const aspect = new Aspect().all(...comps);
  return aspect.entries(world);
}
