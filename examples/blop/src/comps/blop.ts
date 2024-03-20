import { Aspect } from "gw-ecs/world";

export class Blop {
  name: string;
  health: number;
  maxHealth: number;
  power: number;
  charge: number;
  maxCharge: number;

  constructor(name: string, maxHealth: number, power: number = 2) {
    this.name = name;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.power = power;
    this.charge = 0; // Charge is extra damage done on next attack
    this.maxCharge = 5;
  }
}

export const BLOP_ASPECT = new Aspect(Blop);

export const SMALL_BLOP = new Blop("Small Blop", 4, 2);
export const FAT_BLOP = new Blop("Fat Blop", 12, 1);
export const WARRIOR_BLOP = new Blop("Warrior Blop", 8, 4);
export const COMPLEX_BLOP = new Blop("Complex Blop", 5, 2);
