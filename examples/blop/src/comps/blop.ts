export class Blop {
  name: string;
  health: number;
  maxHealth: number;

  constructor(name: string, maxHealth: number) {
    this.name = name;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
  }
}
