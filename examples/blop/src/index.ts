import * as GWU from "gw-utils";
import * as Constants from "./constants";
import { mainScene, addDna, helpScene } from "./scenes";
import { world } from "./world";
import { archiveScene } from "./scenes/archive";

console.log("Hello, search for the " + Constants.BLOPULET_NAME);

const gw = GWU.app.start({
  div: "game",
  width: 50,
  height: 40,
  tileWidth: 15,
  scenes: {
    main: mainScene,
    add_dna: addDna,
    help: helpScene,
    archive: archiveScene,
  },
});

world.setUnique(gw);
