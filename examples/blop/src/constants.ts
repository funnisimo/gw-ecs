import * as GWU from "gw-utils";

//////////////////////////////////////////////////////
// LOGIC
//////////////////////////////////////////////////////

export const WORLD_HEIGHT = 20;
export const WORLD_WIDTH = 20;
export const FLASH_DURATION_MS = 300;
export const MOTION_TRAIL_DURATION_MS = 700;
export const MOTION_TRAIL_DELTA_MS = 200;
export const IMPORTANT_TURN_SLEEP_MS = FLASH_DURATION_MS - 50;
export const CHROMOSOME_FLASH_DURATION_MS = 600;
export const ATTACK_ANIMATION_DURATION_MS = 150;
export const ATTACK_ANIMATION_OFFSET = 0.2; // in number of tile

export const MOVE_ANIMATION_DURATION_MS = 150;
export const CANT_ACT_SLEEP_MS = 300; // Events passed this count on one action will stop triggering genes

export const STOP_TRIGGERING_AT_EVENT_COUNT = 200;
export const STARTING_PLAYER_HEALTH = 20;
export const STARTING_PLAYER_DNA_SIZE = 2;
export const STARTING_PLAYER_ATTACK_DAMAGE = 2;
export const PLAYER_VISIBILITY_RADIUS = 6;
export const STAIRS_MIN_DISTANCE = 15;
export const MIN_BLOP_DISTANCE_AT_START = 4; // Per-level probability

export const ADD_CHROMOSOME_ITEM_PROBABILITY = 30;
export const LOCK_CHROMOSOME_ITEM_PROBABILITY = 10;
export const EXPAND_LIFE_ITEM_PROBABILITY = 10;
export const REINFORCE_ITEM_PROBABILITY = 10;
export const BLOP_NUMBER_STDDEV = 3;
export const BLOP_GENE_PROBABILITY = 100;
export const WORLD_PATCHES_MIN_NUMBER = 4;
export const WORLD_PATCHES_MAX_NUMBER = 10;
export const WORLD_BIG_PATCHES_MIN_SIZE = 2;
export const WORLD_BIG_PATCHES_MAX_SIZE = 7;
export const WORLD_SMALL_PATCHES_MIN_SIZE = 1;
export const WORLD_SMALL_PATCHES_MAX_SIZE = 4;
export const END_DEPTH = 11; //////////////////////////////////////////////////////
// EFFECTS
//////////////////////////////////////////////////////

export const CLEAVE_DAMAGE = 2;
export const EMBER_DAMAGE = 1;
export const SHOCK_DAMAGE = 1;
export const EXPLOSION_RADIUS = 2.5;
export const EXPLOSION_DAMAGE = 3;
export const HURT_SELF_GENE_EFFECT_DAMAGE = 1;
export const LASER_DAMAGE = 1;
export const DESTROY_WALL_RADIUS = 2;
export const BONUS_ATTACK_DAMAGE_PER_CHARGE = 1;
export const MAX_CHARGED_STACKS = 5; //////////////////////////////////////////////////////
// ITEMS
//////////////////////////////////////////////////////

export const EXPAND_LIFE_AMOUNT = 5;
export const REINFORCE_AMOUNT = 1; //////////////////////////////////////////////////////
// DISPLAY DIMENSIONS
//////////////////////////////////////////////////////

export const SCREEN_WIDTH = 50;
export const SCREEN_HEIGHT = 40;

export const HELP_TOP = 0;
export const HELP_LEFT = 0;
export const HELP_WIDTH = SCREEN_WIDTH;
export const HELP_HEIGHT = 4;

export const MAP_WIDTH = WORLD_WIDTH;
export const MAP_HEIGHT = WORLD_HEIGHT;
export const MAP_HEADER_TOP = HELP_TOP + HELP_HEIGHT + 1;
export const MAP_HEADER_WIDTH = MAP_WIDTH;
export const MAP_TOP = MAP_HEADER_TOP + 2;
export const MAP_LEFT = 0;

export const SIDEBAR_LEFT = MAP_WIDTH + 2;
export const SIDEBAR_TOP = MAP_TOP;
export const SIDEBAR_WIDTH = SCREEN_WIDTH - MAP_WIDTH - 1;
export const SIDEBAR_HEIGHT = MAP_HEIGHT + 2; // including header

export const LOG_TOP = MAP_TOP + MAP_HEIGHT + 2;
export const LOG_LEFT = 0;
export const LOG_WIDTH = SCREEN_WIDTH;
export const LOG_HEIGHT = SCREEN_HEIGHT - LOG_TOP;

// export const TEXT_WIDTH_COEF = 2;
// export const LOG_TEXT_WIDTH = LOG_WIDTH * TEXT_WIDTH_COEF;
// export const INFO_WIDTH = 20;
// export const INFO_TEXT_WIDTH = INFO_WIDTH * TEXT_WIDTH_COEF;
// export const MAP_HEADER_OFFSET = GWU.xy.xy(1 + LOG_WIDTH + 1, 1);
// export const MAP_HEADER_TEXT_WIDTH = MAP_HEADER_WIDTH * TEXT_WIDTH_COEF;
// export const MAP_HEADER_HEIGHT = 1;
// export const MAP_OFFSET = GWU.xy.plus(
//   MAP_HEADER_OFFSET,
//   GWU.xy.xy(0, MAP_HEADER_HEIGHT + 1)
// );
// export const HELP_OFFSET = GWU.xy.xy(
//   MAP_HEADER_OFFSET.x,
//   MAP_OFFSET.y + MAP_HEIGHT + 1
// );
// export const HELP_TEXT_WIDTH = HELP_WIDTH * TEXT_WIDTH_COEF;
// export const DISPLAY_HEIGHT =
//   1 + MAP_HEADER_HEIGHT + 1 + MAP_HEIGHT + 1 + HELP_HEIGHT + 1;
// export const LOG_OFFSET = GWU.xy.xy(1, 1);
// export const INFO_HEIGHT = DISPLAY_HEIGHT - 2;
// export const INFO_OFFSET = GWU.xy.xy(MAP_OFFSET.x + MAP_WIDTH + 1, 1);
// export const DISPLAY_WIDTH = 1 + LOG_WIDTH + 1 + MAP_WIDTH + 1 + INFO_WIDTH + 1;
// export const HEALTH_GAUGE_LENGTH = 20;
// export const MODAL_OFFSET = GWU.xy.xy(15, 8);
// export const MODAL_WIDTH = DISPLAY_WIDTH - 2 * MODAL_OFFSET.x;
// export const MODAL_TEXT_WIDTH = MODAL_WIDTH * TEXT_WIDTH_COEF;
// export const DETAILS_WIDTH = 20;
// export const DETAILS_OFFSET = GWU.xy.xy(
//   DISPLAY_WIDTH - 1 - INFO_WIDTH - 2 - DETAILS_WIDTH,
//   2
// );
// export const DETAILS_TEXT_WIDTH = DETAILS_WIDTH * TEXT_WIDTH_COEF;
// export const LINES_BETWEEN_DETAILS_SECTIONS = 3;
// export const LINE_WIDTH_RATIO = 0.2;

//////////////////////////////////////////////////////
// COLORS
//////////////////////////////////////////////////////

export const BACKGROUND_COLOR = GWU.color.make("black");
export const DEFAULT_TEXT_COLOR = GWU.color.make("#ddd");
export const GREYED_COLOR = GWU.color.make("grey");
export const LINE_COLOR = GWU.color.make("#ccc");
export const CURSOR_COLOR = DEFAULT_TEXT_COLOR;
export const HELP_COLOR = GWU.color.make("#bbb");
export const DESCRIPTION_COLOR = HELP_COLOR;
export const SELECTION_BG_COLOR = GWU.color.make("#444");
export const GOOD_COLOR = GWU.color.make("lime");
export const BAD_COLOR = GWU.color.make("crimson");
export const GUIDE_TEXT_COLOR = GWU.color.make("#76befc");
export const PLAYER_COLOR = GWU.color.make("white");
export const FLASH_COLOR_LOSE_LIFE = GWU.color.make("red");
export const FLASH_COLOR_PICK_GENE = GWU.color.make("#66f");
export const FLASH_COLOR_HEAL = GWU.color.make("lime");
export const FLASH_COLOR_MISSED_HIT = GWU.color.make("dark_grey");
export const FLASH_COLOR_TELEPORT = GWU.color.make("cyan");
export const FLASH_COLOR_DESTROY_WALL = GWU.color.make("orange");
export const FLASH_COLOR_SHOCK = GWU.color.make("#0ef");
export const FLASH_COLOR_SUMMON = GWU.color.make("#0d05fc");
export const FLASH_COLOR_TRIGGERED_CHROMOSOME = GWU.color.make("#666");
export const FLASH_COLOR_EXPLOSION = GWU.color.make("orange");
export const FLASH_COLOR_LASER = GWU.color.make("pink");
export const HEALTH_GAUGE_FULL_COLOR = GWU.color.make("#1efc0a");
export const HEALTH_GAUGE_EMPTY_COLOR = GWU.color.make("red");
export const ITEM_COLOR = GWU.color.make("#db49fc");
export const BLOPULET_COLOR = GWU.color.make("gold");
export const TRIGGER_GENE_COLOR = GWU.color.make("#05fca9");
export const EFFECT_GENE_COLOR = GWU.color.make("cyan");

//////////////////////////////////////////////////////
// STRINGS
//////////////////////////////////////////////////////

export const GENE_CHAR = "§";
export const BLOPULET_NAME = "The Blopulet";
export const YES = "Yes";
export const NO = "No";
export const STAIRS_QUESTION =
  "Do you want to go to the next level? You will:\n- Lose every status\n- Get back to max HP";
export const UNKNOWN_CELL_NAME = "???";
export const UNKNOWN_CELL_DESCRIPTION = "This space is unexplored yet.";
export const PLAYER_DESCRIPTION = "This is YOU!";

//# sourceURL=webpack://7drl-2021-blob-genes/./src/constants.ts?
