import { type Buffer } from "gw-utils/buffer";
import * as Constants from "../constants";
import type { Scene, Event, SceneCreateOpts } from "gw-utils/app";
import type { World } from "gw-ecs/world";
import type { Entity } from "gw-ecs/entity";
import { Trigger, Effect, Blop } from "../comps";
import { DNA } from "../comps/dna";
import { coloredName } from "../utils";
import { drawLines, drawLog, drawMap, drawMapHeader } from "./main";
import { Log } from "../uniques";

interface MyData {
  world: World;
  entity: Entity;
  chromosome: Entity;
  dna: DNA;
  trigger: Trigger;
  effect: Effect;
  index: number;
}

export const addDna: SceneCreateOpts = {
  start(
    this: Scene,
    opts: { world: World; entity: Entity; chromosome: Entity }
  ) {
    const dna = opts.entity.fetch(DNA)!;

    this.data.world = opts.world;
    this.data.entity = opts.entity;
    this.data.chromosome = opts.chromosome;
    this.data.dna = dna;
    this.data.trigger = opts.chromosome.fetch(Trigger);
    this.data.effect = opts.chromosome.fetch(Effect);
    this.data.index = this.data.trigger
      ? dna.triggers.indexOf(null)
      : dna.effects.indexOf(null);
  },
  keypress(this: Scene, ev: Event) {
    this.needsDraw = true;
    if (ev.key === "Escape") {
      this.stop();
    } else if (ev.key === "Enter") {
      if (this.data.index >= 0) {
        if (this.data.trigger) {
          this.data.dna.triggers[this.data.index] = this.data.trigger;
        } else {
          this.data.dna.effects[this.data.index] = this.data.effect;
        }
        this.data.world.destroyNow(this.data.chromosome);
      }
      this.stop();
    } else if (ev.dir) {
      if (ev.dir[0] > 0 || ev.dir[1] > 0) {
        this.data.index += 1;
      } else if (ev.dir[0] < 0 || ev.dir[1] < 0) {
        if (this.data.index < 0) {
          this.data.index = this.data.dna.length - 1;
        } else {
          this.data.index -= 1;
        }
      }
    }
  },
  update(this: Scene) {
    if (this.data.index < -1 || this.data.index >= this.data.dna.length) {
      this.data.index = -1;
    }
  },
  draw(buffer: Buffer) {
    buffer.blackOut();

    drawDnaHelp(buffer, this.data as MyData);

    drawLines(buffer);

    drawMapHeader(
      buffer,
      Constants.MAP_LEFT,
      Constants.MAP_HEADER_TOP,
      Constants.MAP_WIDTH,
      1
    );
    drawMap(buffer, Constants.MAP_LEFT, Constants.MAP_TOP);
    drawLog(
      buffer,
      this.data.world.getUnique(Log),
      Constants.LOG_LEFT,
      Constants.LOG_TOP,
      Constants.LOG_WIDTH,
      Constants.LOG_HEIGHT
    );

    drawAddDnaStatus(buffer, this.data as MyData);
    //   Constants.SIDEBAR_LEFT,
    //   Constants.SIDEBAR_TOP,
    //   Constants.SIDEBAR_WIDTH,
    //   Constants.SIDEBAR_HEIGHT
    // );
  },
};

function drawDnaHelp(buffer: Buffer, data: MyData) {
  buffer.fillRect(
    0,
    0,
    Constants.SCREEN_WIDTH,
    Constants.HELP_HEIGHT,
    " ",
    "white",
    "black"
  );

  buffer.wrapText(
    0,
    0,
    Constants.SCREEN_WIDTH,
    "Choose the slot to place the new chromosome into.",
    "yellow"
  );

  if (data.trigger) {
    buffer.wrapText(
      0,
      2,
      Constants.SCREEN_WIDTH,
      `#{green ${data.trigger.name}} - Fires ${data.trigger.description}`
    );
  } else if (data.effect) {
    buffer.wrapText(
      0,
      2,
      Constants.SCREEN_WIDTH,
      `#{teal ${data.effect.name}} - ${data.effect.description}`
    );
  }
}

export function drawAddDnaStatus(buffer: Buffer, data: MyData) {
  const x0 = Constants.SIDEBAR_LEFT;
  const y0 = Constants.SIDEBAR_TOP;
  const w = Constants.SIDEBAR_WIDTH;
  const h = Constants.SIDEBAR_HEIGHT;

  buffer.fillRect(x0, y0, w, h, " ", "white", "black");

  const blop = data.entity.fetch(Blop)!;
  buffer.drawText(x0, y0, coloredName(data.entity));
  buffer.drawProgress(
    x0,
    y0 + 1,
    w,
    "green",
    "blue",
    blop.health,
    blop.maxHealth,
    `HP: ${blop.health}/${blop.maxHealth}`
  );
  buffer.drawText(x0, y0 + 2, `Power: ${blop.power}`);
  buffer.drawText(
    x0,
    y0 + 2,
    `Charge: ${blop.charge}`,
    undefined,
    undefined,
    w,
    "right"
  );

  // dna
  buffer.drawText(x0, y0 + 4, "DNA:");
  const dna = data.dna;
  for (let i = 0; i < dna.length; ++i) {
    let trigger = dna.triggers[i];
    let effect = dna.effects[i];

    let triggerText = `#{green ${trigger ? trigger.name : "..."}}`;
    let effectText = `#{teal ${effect ? effect.name : "..."}}`;

    if (data.index == i) {
      if (data.trigger) {
        triggerText = `#{pink ${data.trigger.name}}`;
      } else if (data.effect) {
        effectText = `#{pink ${data.effect.name}}`;
      }
    }

    buffer.drawText(x0, y0 + 5 + i, `§ ${triggerText} : ${effectText}`);
  }

  if (data.index == -1) {
    let name: string;
    if (data.trigger) {
      name = `#{pink ${data.trigger.name}}`;
    } else {
      name = `#{pink ${data.effect.name}}`;
    }
    buffer.drawText(x0, y0 + 4 + dna.length + 2, "Ignore: " + name);
  } else {
    buffer.drawText(x0, y0 + 4 + dna.length + 2, "Ignore: ...");
  }
}
