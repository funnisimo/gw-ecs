# Ananas aus Caracas, Part 3

Well, we can move around and win our game, but there isn't any challenge to it yet. In Part 3, we will add the angry farmer Pedro to the mix. He wanders around the map and if he runs into the Hero, the game is over and you lose.

## Adding Sprites

So Pedro is just like the Hero, except that he will use AI to wander around the map and chase the player. So if we look at our Hero component we see that it currently only has fields for drawing the character (ch, attr), so it is really more of a Sprite class. Lets change it to be that and make some other adjustments - like Tile and Box entities use the Sprite class.

There are lots of little changes associated with this, including creating our `Sprite` component...

    // SPRITE

    class Sprite {
        ch: string;
        attr: terminal.ScreenBuffer.Attributes;

        constructor(ch: string, color: string) {
            this.ch = "@";
            this.attr = { color };
        }
    }

    const SPRITE_ASPECT = new Aspect(Sprite);

    const WALL_SPRITE = new Sprite("#", "gray");
    const FLOOR_SPRITE = new Sprite(".", "white");
    const HERO_SPRITE = new Sprite("@", "yellow");
    const BOX_SPRITE = new Sprite("*", "blue");
    const PEDRO_SPRITE = new Sprite("P", "red");

    // ...
    const world = new World()
      .registerComponent(Sprite)

Now that we have a sprite, we have to remove the drawing related members from the Tile, Box, and Hero...

    // HERO
    class Hero {}

    // BOXES
    class Box {
        ananas: boolean;

        constructor(ananas = false) {
            this.ananas = ananas;
        }
    }

    // TILES
    class Tile {
        blocks: boolean;

        constructor(blocks = false) {
            this.blocks = blocks;
        }
    }

Now, we add the sprite to the entity creation spots...

    // Tile Creation
    function digCallback(x: number, y: number, value: number) {
        const sprite = value ? WALL_SPRITE : FLOOR_SPRITE;
        posMgr.set(world.create(new Tile(!!value), sprite), x, y);
        // ...
    }

    // Box Creation
    posMgr.set(world.create(new Box(count == 1), BOX_SPRITE), loc.x, loc.y);

    // Hero Creation
    const hero = world.create(new Hero(), HERO_SPRITE);

And finally simplify the drawing code to use the `Sprite`...

    // ... DrawSystem.doProcess ...
    map.everyXY((x, y, es) => {
        const entity =
        HERO_ASPECT.first(es) || BOX_ASPECT.first(es) || TILE_ASPECT.first(es)!;

        const sprite = entity.fetch(Sprite)!;
        buf.put({ x, y, attr: sprite.attr, dx: 1, dy: 0, wrap: true }, sprite.ch);
    });

With all of these changes, if you run it everything should look and feel the same.

The full code for the change is [here](../part3a.ts)

## Adding Pedro
