import { Bounds } from "gw-utils/xy";
import { color as Color } from "gw-utils";

//////////////////////////////////////////////////////
// MAP
//////////////////////////////////////////////////////

export const WORLD_HEIGHT = 20;
export const WORLD_WIDTH = 20;
export const WORLD_PATCHES_MIN_NUMBER = 4;
export const WORLD_PATCHES_MAX_NUMBER = 10;
export const WORLD_BIG_PATCHES_MIN_SIZE = 2;
export const WORLD_BIG_PATCHES_MAX_SIZE = 7;
export const WORLD_SMALL_PATCHES_MIN_SIZE = 1;
export const WORLD_SMALL_PATCHES_MAX_SIZE = 4;
export const END_DEPTH = 11;
export const STAIRS_MIN_DISTANCE = 15;
export const MIN_BLOP_DISTANCE_AT_START = 7;

// Per-world probability
export const ADD_CHROMOSOME_ITEM_PROBABILITY = 30;
export const LOCK_CHROMOSOME_ITEM_PROBABILITY = 10;
export const EXPAND_LIFE_ITEM_PROBABILITY = 10;
export const REINFORCE_ITEM_PROBABILITY = 10;

export const BLOP_NUMBER_STDDEV = 3;

//////////////////////////////////////////////////////
// FX
//////////////////////////////////////////////////////

export const FLASH_DURATION_MS = 300;
export const MOTION_TRAIL_DURATION_MS = 700;
export const MOTION_TRAIL_DELTA_MS = 200;
export const IMPORTANT_TURN_SLEEP_MS = FLASH_DURATION_MS - 50;
export const CHROMOSOME_FLASH_DURATION_MS = 600;
export const ATTACK_ANIMATION_DURATION_MS = 150;
export const ATTACK_ANIMATION_OFFSET = 0.2; // in number of tile
export const MOVE_ANIMATION_DURATION_MS = 150;
export const CANT_ACT_SLEEP_MS = 300;
// Events passed this count on one action will stop triggering genes
export const STOP_TRIGGERING_AT_EVENT_COUNT = 200;

//////////////////////////////////////////////////////
// HERO
//////////////////////////////////////////////////////

export const STARTING_PLAYER_HEALTH = 20;
export const STARTING_PLAYER_DNA_SIZE = 2;
export const STARTING_PLAYER_ATTACK_DAMAGE = 2;
export const PLAYER_VISIBILITY_RADIUS = 6;

//////////////////////////////////////////////////////
// AI
//////////////////////////////////////////////////////

export const BLOP_RANDOM_MOVE_CHANCE = 20; // Every 5 idle turns
export const BLOP_WANDER_CHANCE = 10; // Every 10 idle turns
export const BLOP_WANDER_DISTANCE = 10;
export const BLOP_DROP_CHANCE = 100; // Drop chance: BLOP_GENE_PROBABILITY

//////////////////////////////////////////////////////
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
export const MAX_CHARGED_STACKS = 5;

//////////////////////////////////////////////////////
// ITEMS
//////////////////////////////////////////////////////

export const EXPAND_LIFE_AMOUNT = 5;
export const REINFORCE_AMOUNT = 1;

//////////////////////////////////////////////////////
// DISPLAY DIMENSIONS
//////////////////////////////////////////////////////

export const SCREEN_WIDTH = 50;
export const SCREEN_HEIGHT = 40;
export const MAP_WIDTH = WORLD_WIDTH;
export const MAP_HEIGHT = WORLD_HEIGHT;

export const HELP_TOP = 0;
export const HELP_LEFT = 0;
export const HELP_WIDTH = SCREEN_WIDTH;
export const HELP_HEIGHT = 1;

export const MAP_HEADER_TOP = 2;
export const MAP_HEADER_WIDTH = MAP_WIDTH;

export const MAP_BOUNDS = new Bounds(0, 4, MAP_WIDTH, MAP_HEIGHT);
export const SIDEBAR_BOUNDS = new Bounds(
  MAP_WIDTH + 1,
  MAP_HEADER_TOP,
  SCREEN_WIDTH - MAP_WIDTH - 1,
  MAP_HEIGHT + 2
);
export const LOG_BOUNDS = new Bounds(
  0,
  MAP_BOUNDS.bottom + 1,
  SCREEN_WIDTH,
  SCREEN_HEIGHT - MAP_BOUNDS.bottom - 1
);
// export const LOG_TOP = MAP_BOUNDS.bottom + 1;
// export const LOG_LEFT = 0;
// export const LOG_WIDTH = SCREEN_WIDTH;
// export const LOG_HEIGHT = SCREEN_HEIGHT - LOG_TOP;

//////////////////////////////////////////////////////
// COLORS
//////////////////////////////////////////////////////

export const BACKGROUND_COLOR = Color.make("black");
export const DEFAULT_TEXT_COLOR = Color.make("#ddd");
export const GREYED_COLOR = Color.make("grey");
export const LINE_COLOR = Color.make("#ccc");
export const CURSOR_COLOR = DEFAULT_TEXT_COLOR;
export const HELP_COLOR = Color.make("#bbb");
export const DESCRIPTION_COLOR = HELP_COLOR;
export const SELECTION_BG_COLOR = Color.make("#444");
export const GOOD_COLOR = Color.make("lime");
export const BAD_COLOR = Color.make("crimson");
export const GUIDE_TEXT_COLOR = Color.make("#76befc");
export const PLAYER_COLOR = Color.make("white");
export const FLASH_COLOR_LOSE_LIFE = Color.make("red");
export const FLASH_COLOR_PICK_GENE = Color.make("#66f");
export const FLASH_COLOR_HEAL = Color.make("lime");
export const FLASH_COLOR_MISSED_HIT = Color.make("dark_grey");
export const FLASH_COLOR_TELEPORT = Color.make("cyan");
export const FLASH_COLOR_DESTROY_WALL = Color.make("orange");
export const FLASH_COLOR_SHOCK = Color.make("#0ef");
export const FLASH_COLOR_SUMMON = Color.make("#0d05fc");
export const FLASH_COLOR_TRIGGERED_CHROMOSOME = Color.make("#666");
export const FLASH_COLOR_EXPLOSION = Color.make("orange");
export const FLASH_COLOR_LASER = Color.make("pink");
export const HEALTH_GAUGE_FULL_COLOR = Color.make("#1efc0a");
export const HEALTH_GAUGE_EMPTY_COLOR = Color.make("red");
export const ITEM_COLOR = Color.make("#db49fc");
export const BLOPULET_COLOR = Color.make("gold");
export const TRIGGER_GENE_COLOR = Color.make("#05fca9");
export const EFFECT_GENE_COLOR = Color.make("cyan");

//////////////////////////////////////////////////////
// STRINGS
//////////////////////////////////////////////////////

export const GENE_CHAR = "§";
export const BLOPULET_NAME = "The Blopulet";
export const YES = "Yes";
export const NO = "No";
export const STAIRS_QUESTION =
  "Do you want to go to the next world? You will:\n- Lose every status\n- Get back to max HP";
export const UNKNOWN_CELL_NAME = "???";
export const UNKNOWN_CELL_DESCRIPTION = "This space is unexplored yet.";
export const PLAYER_DESCRIPTION = "This is YOU!";

//# sourceURL=webpack://7drl-2021-blob-genes/./src/constants.ts?
