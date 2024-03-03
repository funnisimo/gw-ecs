import { AnyComponent, Entity, World } from "../core";

export function* join(
  world: World,
  ...comps: AnyComponent[]
): Iterable<[Entity, AnyComponent[]]> {
  for (let entity of world.entities()) {
    let out: AnyComponent[] = [];
    if (
      comps.every((c) => {
        const v = entity.fetch(c);
        if (!v) return false;
        out.push(v);
        return true;
      })
    ) {
      yield [entity, out];
    }
  }
}
