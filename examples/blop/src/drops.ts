import { Bundle } from "gw-ecs/entity";
import {
  Blop,
  DNA,
  EntityInfo,
  HealEffectSprite,
  Pickup,
  Sprite,
} from "./comps";
import * as Constants from "./constants";
import { flash } from "./fx/flash";
import { Pos } from "gw-ecs/common";
import { Log } from "./uniques";
import { coloredName } from "./utils";

// TODO - Make other drops

// - Heal
export const ExpandHealthSprite = new Sprite("♥", "pink");

export const EXPAND_HEALTH_BUNDLE = new Bundle(
  ExpandHealthSprite,
  new Pickup((world, actor, heal) => {
    const blop = actor.fetch(Blop);
    if (!blop) return;

    blop.maxHealth += Constants.EXPAND_LIFE_AMOUNT;

    blop.health = Math.min(
      blop.maxHealth,
      blop.health + Constants.EXPAND_LIFE_AMOUNT
    );

    flash(world, actor.fetch(Pos)!, HealEffectSprite);
    world.getUnique(Log).add(`${coloredName(actor)} is #{green healthier}.`);
    world.destroyNow(heal);
  }),
  new EntityInfo("Expand Health", "INTERRUPT_WHEN_SEEN, OBSERVE")
);

// - PowerUp
export const PowerupSprite = new Sprite("↑", "pink");
export const PowerupEffectSprite = new Sprite(null, null, "pink");

export const POWERUP_BUNDLE = new Bundle(
  PowerupSprite,
  new Pickup((world, actor, powerup) => {
    const blop = actor.fetch(Blop);
    if (!blop) return;
    blop.power += 1;
    flash(world, actor.fetch(Pos)!, PowerupEffectSprite);
    world.getUnique(Log).add(`${coloredName(actor)} is #{green stronger}.`);
    world.destroyNow(powerup);
  }),
  new EntityInfo("Powerup", "INTERRUPT_WHEN_SEEN, OBSERVE")
);

// - Add Slot
export const AddSlotSprite = new Sprite("+", "pink");
export const AddSlotEffectSprite = new Sprite(null, null, "pink");

export const ADDSLOT_BUNDLE = new Bundle(
  AddSlotSprite,
  new Pickup((world, actor, addSlot) => {
    const dna = actor.fetch(DNA);
    if (!dna) return;
    dna.addSlot();
    flash(world, actor.fetch(Pos)!, AddSlotEffectSprite);
    world.getUnique(Log).add(`${coloredName(actor)} is more #{green capable}.`);
    world.destroyNow(addSlot);
  }),
  new EntityInfo("Add Dna Slot", "INTERRUPT_WHEN_SEEN, OBSERVE")
);

// - ???
