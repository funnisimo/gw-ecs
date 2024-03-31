import { Entity, Aspect } from "../entity/index.js";
import { World } from "../world/index.js";
import { AnyComponent } from "./component.js";

export function* join(
  world: World,
  ...comps: AnyComponent[]
): Iterable<[Entity, AnyComponent[]]> {
  const aspect = new Aspect().with(...comps);
  for (let entity of world.level.entities().values()) {
    if (aspect.match(entity)) {
      yield [entity, aspect._allComponents.map((c) => entity.fetch(c))];
    }
  }
}
