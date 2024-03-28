import { type RunIfFn, EntitySystem } from "gw-ecs/system";
import { Aspect, World } from "gw-ecs/world";
import { Attack, Blop, DamageSprite, removeAction } from "../comps";
import type { Entity } from "gw-ecs/entity";
import { GameEvent } from "../queues";
import { flash } from "../fx/flash";
import { Pos } from "gw-ecs/common";
import { Log } from "../uniques";
import { coloredName } from "../utils";

export class AttackSystem extends EntitySystem {
  constructor(runIf?: RunIfFn) {
    super(new Aspect(Blop, Attack), runIf);
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const target = removeAction(entity, Attack)!.target;

    const attackBlop = entity.fetch(Blop)!;
    const targetBlop = target.update(Blop)!;

    const damage = attackBlop.power + attackBlop.charge;
    attackBlop.charge = 0;

    targetBlop.health -= damage;

    // TODO - Remove WanderTo?

    world
      .getUnique(Log)
      .add(
        coloredName(entity) +
          " attacks " +
          coloredName(target) +
          " for #{red}-" +
          damage +
          "#{} HP"
      );

    const attackEvent = new GameEvent(entity, "attack", { target, damage });
    world.pushQueue(attackEvent);

    flash(world, target.fetch(Pos)!, DamageSprite);

    if (targetBlop.health <= 0) {
      const killEvent = new GameEvent(entity, "kill", { target, damage });
      world.pushQueue(killEvent);

      world.getUnique(Log).add(coloredName(target) + " dies.");
      world.destroyLater(target); // TODO - world.delay.destroyEntity(target);

      // TODO - corpse
    }

    world.pushQueue(new GameEvent(entity, "turn", { time: 0 }));
  }
}
