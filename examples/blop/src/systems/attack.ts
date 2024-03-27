import { type RunIfFn, EntitySystem } from "gw-ecs/system";
import { Aspect, World } from "gw-ecs/world";
import { Attack, Blop, DamageSprite } from "../comps";
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
    const target = entity.remove(Attack)!.target;

    const attackBlop = entity.fetch(Blop)!;
    const targetBlop = target.update(Blop)!;

    const damage = attackBlop.power + attackBlop.charge;
    attackBlop.charge = 0;

    targetBlop.health -= damage;
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

    // TODO - Reschedule attacker
  }
}
