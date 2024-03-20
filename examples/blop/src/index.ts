import * as GWU from "gw-utils";
import * as Constants from "./constants";
import { mainScene } from "./scenes";

console.log("Hello, search for the " + Constants.BLOPULET_NAME);

const gw = GWU.app.start({
  div: "game",
  width: 50,
  height: 40,
  tileWidth: 15,
  scene: mainScene,
});
