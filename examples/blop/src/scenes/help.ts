import type { SceneCreateOpts, Event } from "gw-utils/app";
import type { Buffer } from "gw-utils/buffer";
import * as Constants from "../constants";

export const helpScene: SceneCreateOpts = {
  input(event: Event) {
    if (event.type == "click" || event.type == "keypress") {
      this.stop();
    }
  },
  draw(buffer: Buffer) {
    buffer.blackOut();

    buffer.drawText(5, 2, "#{teal Bloplike 7DRL} - originally by Drestin");

    buffer.wrapText(
      5,
      4,
      Constants.SCREEN_WIDTH - 10,
      "The goal of the game is to find the #{teal Blopulet} and become the king of the #{orange Blops}."
    );

    buffer.wrapText(
      5,
      8,
      Constants.SCREEN_WIDTH - 10,
      "Gather DNA components to enhance your #{yellow Hero}.  These consist of #{green §} #{green Triggers} and #{teal §} #{teal Effects}.  When #{green Trigger} conditions are met, the #{teal Effect} is fired."
    );

    buffer.wrapText(
      5,
      13,
      Constants.SCREEN_WIDTH - 10,
      "There are enemy #{orange Blops} that will try to stop you.  They (like the #{yellow Hero}) have Health (HP), Power, Charges, and DNA.  Destroy them to get some of their DNA for you to use.  Watch out for high power and highly charged enemies, they will damage the #{yellow Hero}."
    );

    const keys_y = 21;
    buffer.drawText(5, keys_y, "#{yellow}-- Keys --");
    buffer.drawText(5, keys_y + 1, "#{green ARROWS} - Move/attack");
    buffer.drawText(5, keys_y + 2, "#{green g} - Pickup items");
    buffer.drawText(5, keys_y + 3, "#{green >} - Find or take the stairs");
    buffer.drawText(5, keys_y + 4, "#{green Tab+TAB} - Observe");

    buffer.drawText(5, 32, "The original:");
    buffer.drawText(5, 33, "https://drestin.itch.io/7rld2021-bloplike");

    buffer.drawText(
      5,
      Constants.SCREEN_HEIGHT - 2,
      "#{orange}Press <ANY KEY> to close."
    );
  },
};
