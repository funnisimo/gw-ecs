import type { Entity } from "gw-ecs/entity/entity";
import * as Constants from "../constants";
import { Blop, Sprite } from "../comps";
import { removeColors, splitIntoLines } from "gw-utils/text";

export interface LogEntry {
  msg: string;
  count: number;
}

let oldLogsIndex = 0;
export var logs: LogEntry[] = [];

export function addLog(message: string) {
  // TODO - split at log display width...

  const msgs = splitIntoLines(message, Constants.LOG_WIDTH);

  for (let msg of msgs) {
    if (logs.length > 0) {
      const first = logs[0];
      if (first.msg == msg) {
        first.count += 1;
        if (oldLogsIndex == 0) {
          oldLogsIndex = 1;
        }
        return;
      } else if (removeColors(first.msg) == removeColors(msg)) {
        first.msg = msg;
        first.count += 1;
        if (oldLogsIndex == 0) {
          oldLogsIndex = 1;
        }
        return;
      }
    }

    logs.unshift({ msg, count: 1 });
    if (logs.length > Constants.LOG_HEIGHT + 2) {
      logs.length = Constants.LOG_HEIGHT + 2;
    }

    oldLogsIndex += 1;
  }
}

export function addEmptyLine(limitToOne = true) {
  if (!limitToOne || (logs.length && logs[0].msg !== "")) {
    addLog("");
  }
}

export function clearLogs() {
  logs = [];
  oldLogsIndex = 0;
}

export function makeLogsOld() {
  for (let i = oldLogsIndex; i > 0; --i) {
    const log = logs[i - 1];
    log.msg = removeColors(log.msg);
    if (logs.length > i) {
      if (log.msg === logs[i].msg) {
        logs[i].count += 1;
        logs.splice(i - 1, 1); // delete this log
      }
    }
  }
  oldLogsIndex = 0;
  logs.length = Math.min(logs.length, Constants.LOG_HEIGHT);
}

export function coloredName(entity: Entity): string {
  let blop = entity.fetch(Blop)!;
  let sprite = entity.fetch(Sprite)!;

  return "#{" + sprite.fg.css() + "}" + blop.name + "#{}";
}
