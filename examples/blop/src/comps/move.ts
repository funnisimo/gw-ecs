import type { Loc } from "gw-utils";

export class Move {
  _dir: Loc;

  constructor(dir: Loc) {
    this._dir = dir;
  }

  get dir(): Loc {
    return this._dir;
  }
}
