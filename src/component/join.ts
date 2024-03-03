import { Entity } from "../entity";
import { Aspect, World } from "../world";
import { AnyComponent } from "./component";

export function join(
  world: World,
  ...comps: AnyComponent[]
): Iterable<[Entity, AnyComponent[]]> {
  const aspect = new Aspect().all(...comps);
  return aspect.entries(world);
}
