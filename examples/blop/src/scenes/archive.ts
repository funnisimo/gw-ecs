import type { SceneCreateOpts, Event, Scene } from "gw-utils/app";
import type { Buffer } from "gw-utils/buffer";
import * as Constants from "../constants";
import {
  drawHelp,
  drawLines,
  drawLog,
  drawMap,
  drawMapHeader,
  drawStatus,
} from "./main";
import { clamp } from "gw-utils/utils";

let archive_height = 0;
let mode = 1;

export const archiveScene: SceneCreateOpts = {
  start() {
    archive_height = Constants.LOG_BOUNDS.height;
    mode = 1;
  },
  input(event: Event) {
    if (event.type == "click" || event.type == "keypress") {
      if (mode == 1) {
        mode = -1;
      } else {
        this.stop();
      }
    }
  },
  update(this: Scene) {
    archive_height = clamp(
      archive_height + mode,
      Constants.LOG_BOUNDS.height,
      Constants.SCREEN_HEIGHT
    );
    this.needsDraw = true;
    if (mode == -1 && archive_height <= Constants.LOG_BOUNDS.height) {
      this.stop(); // close if we hide all the archive
    }
  },
  draw(buffer: Buffer) {
    buffer.blackOut();

    drawLines(buffer);

    drawHelp(buffer, Constants.HELP_HEIGHT);

    drawMapHeader(buffer, 0, Constants.MAP_HEADER_TOP);
    drawMap(buffer, Constants.MAP_BOUNDS);
    drawStatus(buffer, Constants.SIDEBAR_BOUNDS);

    if (archive_height < Constants.SCREEN_HEIGHT) {
      const y = Constants.SCREEN_HEIGHT - archive_height - 1;
      buffer.drawLineH(0, y, Constants.SCREEN_WIDTH, "-", "white", "black");
    }

    drawLog(buffer, Constants.LOG_BOUNDS, archive_height);
  },
};
