import * as GWU from "gw-utils/index";
import * as Constants from "./constants";
import type { ColorBase } from "gw-utils/color";
import { Aspect, World } from "gw-ecs/world";
import { Hero, Sprite, Tile } from "./comps";
import { nextLevel } from "./map/nextLevel";
import { Pos, PosManager } from "gw-ecs/utils/positions";

console.log("Hello, search for the " + Constants.BLOPULET_NAME);

const world = new World()
  .registerComponent(Hero)
  .registerComponent(Tile)
  .registerComponent(Sprite);

const gw = GWU.app.start({
  div: "game",
  width: 50,
  height: 40,
  tileWidth: 15,
  scene: {
    start() {
      nextLevel(world);
    },
    click(ev: GWU.app.Event) {
      console.log("click", ev.x, ev.y);
    },
    keypress(ev: GWU.app.Event) {
      if (ev.key == " ") {
        nextLevel(world);
        this.needsDraw = true;
      } else {
        console.log("key", ev.key);
      }
    },
    draw(buffer) {
      drawLineH(buffer, 0, 5, 50, "-", "white", "black");
      drawLineV(buffer, 20, 6, 22, "|", "white", "black");
      drawLineH(buffer, 0, 7, 20, "-", "white", "black");
      drawLineH(buffer, 0, 28, 50, "-", "white", "black");

      drawMap(buffer, world, 0, 8);
      // GWU.xy.forRect(buffer.width, buffer.height, (x, y) => {
      //   const ch = String.fromCharCode(65 + GWU.rng.random.number(26));
      //   const fg = GWU.rng.random.number(0x1000);
      //   const bg = GWU.rng.random.number(0x1000);
      //   buffer.draw(x, y, ch, fg, bg);
      // });
    },
  },
});

function drawMap(
  buffer: GWU.buffer.Buffer,
  world: World,
  x0: number,
  y0: number
) {
  const mgr = world.getUnique(PosManager);

  mgr.everyXY((x, y, entities) => {
    if (entities.length == 0) {
      buffer.draw(x + x0, y + y0, "!", "red");
    } else {
      const sprite = entities[0].fetch(Sprite)!;
      buffer.draw(x + x0, y + y0, sprite.ch, sprite.fg, sprite.bg);
    }
  }, new Aspect(Pos, Sprite));
}

function drawLineH(
  buffer: GWU.buffer.Buffer,
  x: number,
  y: number,
  w: number,
  ch: string,
  fg: ColorBase,
  bg: ColorBase
) {
  for (let dx = 0; dx < w; ++dx) {
    buffer.draw(x + dx, y, ch, fg, bg);
  }
}

function drawLineV(
  buffer: GWU.buffer.Buffer,
  x: number,
  y: number,
  h: number,
  ch: string,
  fg: ColorBase,
  bg: ColorBase
) {
  for (let dy = 0; dy < h; ++dy) {
    buffer.draw(x, y + dy, ch, fg, bg);
  }
}
