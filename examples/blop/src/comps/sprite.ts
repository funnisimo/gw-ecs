import { Sprite, type SpriteConfig } from "gw-utils/sprite";

export { Sprite, type SpriteConfig };

export const HeroSprite = new Sprite("@", "yellow");

export const SmallBlopSprite = new Sprite("s", "orange");
export const FatBlopSprite = new Sprite("F", "pink");
export const WarriorBlopSprite = new Sprite("W", "crimson");
export const ComplexBlopSprite = new Sprite("C", "blue");

export const TriggerSprite = new Sprite("$", "green");
export const EffectSprite = new Sprite("$", "cyan");

export const BumpSprite = new Sprite(null, null, "red");
