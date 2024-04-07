import { type RunIfFn, EntitySystem } from "gw-ecs/system";
import { World } from "gw-ecs/world";
import { Attack, Blop, DamageSprite, removeAction } from "../comps";
import { Aspect, Entity } from "gw-ecs/entity";
import { GameEvent } from "../queues";
import { flash } from "../fx/flash";
import { Pos } from "gw-ecs/common";
import { Log } from "../uniques";
import { coloredName } from "../utils";
import { Interrupt } from "../triggers";

export class AttackSystem extends EntitySystem {
  constructor(runIf?: RunIfFn) {
    super(new Aspect(Blop, Attack), runIf);
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const target = removeAction(entity, Attack)!.target;
    const attackBlop = entity.fetch(Blop)!;
    const damage = attackBlop.power + attackBlop.charge;
    attackBlop.charge = 0;

    const attackEvent = new GameEvent(entity, "attack", { target, damage });
    world.pushQueue(attackEvent);

    applyAttack(world, entity, target, damage);

    world.pushQueue(new GameEvent(entity, "turn", { time: 0 }));
  }
}

export function applyAttack(
  world: World,
  actor: Entity,
  target: Entity,
  damage: number,
  verb: string = "attacks"
) {
  const attackBlop = actor.fetch(Blop)!;
  const targetBlop = target.update(Blop)!;

  targetBlop.health = Math.max(0, targetBlop.health - damage);
  world.emitTrigger(new Interrupt(target));

  world
    .getUnique(Log)
    .add(
      coloredName(actor) +
        " " +
        verb +
        " " +
        coloredName(target) +
        " for #{red}-" +
        damage +
        "#{} HP"
    );

  flash(world, target.fetch(Pos)!, DamageSprite);

  if (targetBlop.health <= 0) {
    const killEvent = new GameEvent(actor, "kill", { target, damage });
    world.pushQueue(killEvent);

    world.getUnique(Log).add(coloredName(target) + " dies.");
    world.destroyLater(target); // TODO - world.delay.destroyEntity(target);

    // TODO - corpse
  }
}
