import * as Color from "gw-utils/color";

export interface SpriteConfig {
  ch: string;
  fg?: Color.ColorBase;
  bg?: Color.ColorBase;
}

export class Sprite {
  ch: string;
  fg: Color.Color;
  bg: Color.Color;

  constructor(
    ch: string,
    fg: Color.ColorBase = "white",
    bg: Color.ColorBase = null
  ) {
    this.ch = ch;
    this.fg = Color.make(fg);
    this.bg = Color.make(bg);
  }
}

export const HeroSprite = new Sprite("@", "yellow");
