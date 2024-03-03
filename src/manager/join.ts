import { AnyComponent, Aspect, Entity, World } from "../core";

export function join(
  world: World,
  ...comps: AnyComponent[]
): Iterable<[Entity, AnyComponent[]]> {
  const aspect = new Aspect().all(...comps);
  return aspect.entries(world);
}
