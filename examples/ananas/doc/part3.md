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

Now we can add Pedro. We are going to add Pedro the same way we add a Hero. He is an entity that gets a `Pedro` component (along with a `Sprite`). The main thing is that we want to add Perdo relatively far away from our Hero so that the Hero does not get attacked right away.

    // PEDRO

    class Pedro {}

    const PEDRO_ASPECT = new Aspect(Pedro);

    // ... with other sprites ...
    const PEDRO_SPRITE = new Sprite("P", "red");

    // ... DrawSystem.doProcess ...
    map.everyXY((x, y, es) => {
      const entity =
        HERO_ASPECT.first(es) ||
        PEDRO_ASPECT.first(es) ||   // <<< Add Pedro
        BOX_ASPECT.first(es) ||
        TILE_ASPECT.first(es)!;

      const sprite = entity.fetch(Sprite)!;
      buf.put({ x, y, attr: sprite.attr, dx: 1, dy: 0, wrap: true }, sprite.ch);
    }, new Aspect(Pos, Sprite));

    // ... digMap ...
    const loc = placeHero(world, floors);
    placePedro(world, loc, floors);

    // ... placeHero
    function placeHero(...): { x: number, y: number } {
        // ... existing
        return loc;
    }

    function placePedro(
        world: World,
        avoidLoc: { x: number; y: number },
        locs: { x: number; y: number }[]
    ) {
        const posMgr = world.getUnique(PosManager);

        // We need to find a place far from our hero so that they have a chance to get going before Pedro
        // bears down on them.
        const dist = locs.map(
            (xy) => Math.abs(avoidLoc.x - xy.x) + Math.abs(avoidLoc.y - xy.y)
        );
        const maxDist = Math.max(...dist);
        const index = dist.indexOf(maxDist);
        var loc = locs.splice(index, 1)[0];

        const pedro = world.create(new Pedro(), PEDRO_SPRITE);
        posMgr.set(pedro, loc.x, loc.y);
    }

This is pretty straight forward, except where we place Pedro. The code there turns all of the available locations (locs) to spawn into a distance from the player location (avoidLoc). Then it finds the maximum value in that list and uses a location with that maximum value as Perdo's starting location.

Now, if you run the game, Pedro will be sitting somewhere in the map, waiting...

The full source for this part can be found [here](../part3b.ts)

## Moving Pedro

Now that we have Pedro on the map, we need him to move around, and eventually hunt down the player. Lets start by having him walk to inspect his boxes. To do that we are going to have him pick a random box to go and inspect. Then he is going to move to that box. Once he is there, he will pick a different box and will move to that box. That way he is moving around the map with a purpose and not just doing a drunken walk.

The first thing we have to decide is how to tell Pedro to take a turn. Our game loop runs every 16 ms or so, but we only want Pedro to act when the Hero acts - turn for turn.

The way we are going to do this is to keep a global flag that tells the systems that it is ok to take a turn. Lets create an object that we will put in that handles this and holds our Hero Entity.

    class GameInfo {
        hero: Entity;
        takeTurn: boolean;

        constructor(hero: Entity, takeTurn=false) {
            this.hero = hero;
            this.takeTurn = takeTurn;
        }
    }

    // ... placeHero ...
    world.setUnique(new GameInfo(hero));

    // ... and in our key handler, term.on('key', ... )
    const hero = world.getUnique(GameInfo).hero;

So we want our turn based systems to respect the `takeTurn` flag. So lets create a base class for a `EntityTurnSystem` that does this check for us. And we will use it for our `OpenSystem` and `MoveSystem` systems.

    abstract class EntityTurnSystem extends EntitySystem {
        isEnabled(): boolean {
            return super.isEnabled() && this.world.getUnique(GameInfo).takeTurn;
        }
    }

    // ...
    class OpenSystem extends EntityTurnSystem { ... }
    class MoveSystem extends EntityTurnSystem { ... }

This new base class only enables our system whenever the `takeTurn` flag is set. So we need to set it when we want the player to take a turn and we need to turn it off when the turn is over. Turning it off is done with a simple system that we put last in our systems. And turning it on is just setting the flag whenever we put an action onto our Hero.

    class TurnOverSystem extends System {
        protected doProcess(): void {
            const game = this.world.getUnique(GameInfo);
            game.takeTurn = false;
        }
    }

    // ... World setup ...
    const world = new World()
        // ...
        .addSystem(new MoveSystem())
        .addSystem(new OpenSystem())
        .addSystem(new DrawSystem())
        .addSystem(new TurnOverSystem())    // <<< Make sure it is last
        // ...

    // ... term.on('key', ... )
    if (name === "CTRL_C" || name === "q") {
        // ...
    } else if (["LEFT", "RIGHT", "UP", "DOWN"].includes(name)) {
        const game = world.getUnique(GameInfo);
        game.hero.add(new Move(name));
        game.takeTurn = true;
    } else if ([" ", "ENTER"].includes(name)) {
        const game = world.getUnique(GameInfo);
        game.hero.add(new Open());
        game.takeTurn = true;
    } else {
        // ...
    }

That should do it for creating our turn system. If you run it now, nothing has really changed, but we are ready to move Pedro around.

We are going to put some of the logic for Pedro into a new system, the `PedroSystem`. This is going to be a `EntityTurnSystem` that does his logic. This new system will start by checking Pedro to see if he has a path to walk. If so, it puts a `Move` component on Pedro for the next step in the path. If not, it picks a random `Box` to walk to and finds the path to that box, adding it to the `Pedro` component.

One thing that will need to change right away is the fact that we are removing the boxes after we inspect them. That means that eventually there might only be one box left in the game and it would be a footrace between our Hero and Pedro to get there. If Pedro gets there first, our player cannot win. Instead, lets keep the boxes there, but change the `Sprite` so that the player visually knows that they have inspected that box.

    // ... with other sprites
    const BOX_SPRITE = new Sprite("*", "brightBlue");
    const EMPTY_BOX_SPRITE = new Sprite("*", "green");

    // ... OpenSystem.processEntity
    // this.world.queueDestroy(boxEntity);
    boxEntity.add(EMPTY_BOX_SPRITE);

This changes our box sprite so that we don't have to remember the boxes that we have checked.

Now, lets do the Pedro logic...

## Checking his Boxes

Pedro will move around the map checking on his boxes to make sure they are all ok.

## Chasing the Hero

If Pedro sees the Hero, he will start to chase them. If Pedro catches the Hero, the game is over and the Hero loses.
