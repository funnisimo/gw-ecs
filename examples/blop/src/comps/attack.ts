import type { Entity } from "gw-ecs/entity";
import { Action } from "./action";
import type { World } from "gw-ecs/world";
import { Blop } from "./blop";
import { GameEvent } from "../queues";
import { takeTurn } from "./actor";
import { Interrupt } from "../triggers";
import { Log } from "../uniques";
import { coloredName } from "./entityInfo";
import { flash } from "../fx/flash";
import { Pos } from "gw-ecs/common";
import { DamageSprite } from "./sprite";

export class Attack extends Action {
  target: Entity;

  constructor(target: Entity) {
    super();
    this.target = target;
  }

  act(world: World, actor: Entity): void {
    const target = this.target;
    const attackBlop = actor.fetch(Blop)!;
    const damage = attackBlop.power + attackBlop.charge;
    attackBlop.charge = 0;

    const attackEvent = new GameEvent(actor, "attack", { target, damage });
    world.pushQueue(attackEvent);

    applyAttack(world, actor, target, damage);

    takeTurn(world, actor);
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

  if (!target.isAlive() || targetBlop.health <= 0) return;

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
