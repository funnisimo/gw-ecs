import { removeColors, splitIntoLines } from "gw-utils/text";
import * as Constants from "../constants";

export interface LogEntry {
  msg: string;
  count: number;
}

export class Log {
  oldLogsIndex = 0;
  logs: LogEntry[] = [];
  maxLength: number;
  maxWidth: number;

  constructor(maxLength = 100, maxWidth = 80) {
    this.maxLength = maxLength;
    this.maxWidth = maxWidth;
  }

  get(index: number): LogEntry {
    return this.logs[index];
  }

  add(message: string) {
    // TODO - split at log display width...

    const msgs = splitIntoLines(message, this.maxWidth);

    for (let msg of msgs) {
      if (this.logs.length > 0) {
        const first = this.logs[0];
        if (first.msg == msg) {
          first.count += 1;
          if (this.oldLogsIndex == 0) {
            this.oldLogsIndex = 1;
          }
          return;
        } else if (removeColors(first.msg) == removeColors(msg)) {
          first.msg = msg;
          first.count += 1;
          if (this.oldLogsIndex == 0) {
            this.oldLogsIndex = 1;
          }
          return;
        }
      }

      this.logs.unshift({ msg, count: 1 });
      if (this.logs.length > this.maxLength + 2) {
        this.logs.length = this.maxLength + 2;
      }

      this.oldLogsIndex += 1;
    }
  }

  addEmptyLine(limitToOne = true) {
    if (!limitToOne || (this.logs.length && this.logs[0].msg !== "")) {
      this.add("");
    }
  }

  clearLogs() {
    this.logs = [];
    this.oldLogsIndex = 0;
  }

  makeLogsOld() {
    for (let i = this.oldLogsIndex; i > 0; --i) {
      const log = this.logs[i - 1];
      log.msg = removeColors(log.msg);
      if (this.logs.length > i) {
        if (log.msg === this.logs[i].msg) {
          this.logs[i].count += 1;
          this.logs.splice(i - 1, 1); // delete this log
        }
      }
    }
    this.oldLogsIndex = 0;
    this.logs.length = Math.min(this.logs.length, this.maxLength);
  }
}
