# Ananas aus Caracas, Part 2

In part 2, we add our Hero and get them to move around the map, eventually collecting the contents of the boxes.

## Adding a Hero

We start by adding a component for our Hero, registering it, and adding it to our draw code...

    // HERO

    class Hero {
        ch: string;
        attr: terminal.ScreenBuffer.Attributes;

        constructor() {
            this.ch = "@";
            this.attr = { color: "yellow" };
        }
    }

    const HERO_ASPECT = new Aspect(Hero);

    // ... DrawSystem ...
    protected doProcess(): void {
        const buf = this._buf;
        const map = this.world.getGlobal(PosManager);

        map.everyXY((x, y, es) => {
            ifDo(HERO_ASPECT.first(es), (e) => {
                const hero = e.fetch(Hero)!;
                buf.put({ x, y, attr: hero.attr, dx: 1, dy: 0, wrap: true }, hero.ch);
            }) ||
                ifDo(BOX_ASPECT.first(es), (e) => {
                    const box = e.fetch(Box)!;
                    buf.put({ x, y, attr: box.attr, dx: 1, dy: 0, wrap: true }, box.ch);
                }) ||
                ifDo(TILE_ASPECT.first(es), (e) => {
                    const tile = e.fetch(Tile)!;
                    buf.put({ x, y, attr: tile.attr, dx: 1, dy: 0, wrap: true }, tile.ch);
                });
        });
        buf.draw();
    }

    // ...
    const world = new World()
        .registerComponent(Hero)
        // ...
        .start();

And we need a function to place our Hero. While we are at it, because the Hero is so special we are going to store the Hero Entity as a global. That way we can more easily get it from our systems...

    function placeHero(world: World, locs: { x: number; y: number }[]) {
        const posMgr = world.getGlobal(PosManager);
        var index = Math.floor(ROT.RNG.getUniform() * locs.length);
        var loc = locs.splice(index, 1)[0];
        const hero = world.create(new Hero());
        posMgr.set(hero, loc.x, loc.y);
        world.setGlobal(hero);
    }

Now we add to the `digMap` function a call to place our Hero...

    // ... digMap ...
    digger.create(digCallback);

    placeHero(world, floors);
    placeBoxes(world, 10, floors);

Ok. If we run it now we should see our Hero, ready to get going!

The full code to this point can be found [here](../part2a.ts)

## Moving our Hero

To move our Hero, we are going to use a component (Move) that is added to the Hero and a system (MoveSystem) that removes that component and does the move. Then in the input handling, we can just add the component to the Hero and they should move around...

Here is our Move component...

    // MOVE

    const DIRS: { [key: string]: { x: number; y: number } } = {
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
    };

    class Move {
        dirName: string;

        constructor(dirName: string) {
            this.dirName = dirName;
        }
    }

    // ...
    const world = new World()
      .registerComponent(Move)
      // ...

And now, the move system. This system is an `EntitySystem` which means it's base class constructor expects an `Aspect` that is used to determine which entities to process. Each game loop iteration, all the entities are tested against this aspect and any that match are forwarded on to the `doProcess` method for processing. Our aspect ensures that our entities have a `Move` and a `Pos` component.

Our `doProcess` removes the `Move` component and uses it's `dirName` along with the entity's current `Pos` to try to move the entity. If the tile in the new grid does not block then the entity is moved there.

    class MoveSystem extends EntitySystem {
        constructor() {
            super(new Aspect(Move, Pos));
        }

        protected processEntity(entity: Entity): void {
            const term = this.world.getGlobal(Term).term;
            const posMgr = this.world.getGlobal(PosManager);
            const pos = entity.fetch(Pos)!;

            const dirName = entity.remove(Move)!.dirName;
            const dxy = DIRS[dirName];
            const newX = pos.x + dxy.x;
            const newY = pos.y + dxy.y;

            // There has to be a Tile entity on every square
            const tile = posMgr.getAt(newX, newY, TILE_ASPECT)[0]!.fetch(Tile)!;

            if (!tile.blocks) {
                posMgr.set(entity, newX, newY);
                term.moveTo(0, 26).eraseLine.green(dirName);
            } else {
                term.moveTo(0, 26).eraseLine.red("Blocked: %s", dirName);
            }
        }
    }

    // ...
    const world = new World()
        .addSystem(new MoveSystem())    // Be sure this is before the DrawSystem
        .addSystem(new DrawSystem())
        // ...

And finally, we put a `Move` component onto our `Hero` whenever an arrow key is pressed.

    term.on("key", function (name, matches, data) {
        if (name === "CTRL_C" || name === "q") {
            term.moveTo(0, 26).eraseLine.blue("QUIT");
            term.grabInput(false);
            term.processExit(0);
        } else if (["LEFT", "RIGHT", "UP", "DOWN"].includes(name)) {
            const hero = world.getGlobal(Entity);
            hero.add(new Move(name));
        } else {
            term.moveTo(0, 26).eraseLine.red("Unknown key: ", name);
        }
    });

When you run the app, you will be able to move the Hero around on the floor tiles.

The full code for this part is [here](../part2b.ts)

## Opening our Boxes

The whole point of the game is to find the ananas. So lets make it so that our player can open some of those boxes we places around the map. We will use a similar strategy to what we did with moving -- an `OpenBox` component and service along with adding the component on a spacebar or enter key press.

We will also slightly chnage our Boxes so that one of them will have the ananas in it. If you open that box, you win!

    class Box {
        ch: string;
        attr: terminal.ScreenBuffer.Attributes;
        ananas: boolean;    // <<< New

        constructor(ananas = false) {
            this.ch = "*";
            this.attr = { color: "blue" };
            this.ananas = ananas;
        }
    }

    // ...
    function placeBoxes(
        world: World,
        count: number,
        locs: { x: number; y: number }[]
    ) {
        count = Math.min(count, locs.length);
        const posMgr = world.getGlobal(PosManager);

        while (count) {
            var index = Math.floor(ROT.RNG.getUniform() * locs.length);
            var loc = locs.splice(index, 1)[0];
            posMgr.set(world.create(new Box(count == 1)), loc.x, loc.y);    // <<< Changed
            count -= 1;
        }
    }

Now the last box that we place will be the one with the ananas in it.

And we can add the new component and system. The system removes the `Open` component and then checks for `Box` components at that position. If there isn't one, it logs a message and returns. If there is one, it checks to see if it is the winner or not.

    // OPEN

    class Open {}

    class OpenSystem extends EntitySystem {
        constructor() {
            super(new Aspect(Open, Pos));
        }

        protected processEntity(entity: Entity): void {
            const term = this.world.getGlobal(Term).term;
            const posMgr = this.world.getGlobal(PosManager);
            const pos = entity.fetch(Pos)!;

            entity.remove(Open);

            // There has to be a Tile entity on every square
            const boxEntity = posMgr.getAt(pos.x, pos.y, BOX_ASPECT)[0];
            if (!boxEntity) {
                term.moveTo(0, 26).eraseLine.red("Nothing to open.");
                return;
            }
            const box = boxEntity.fetch(Box)!;

            if (!box.ananas) {
                term.moveTo(0, 26).eraseLine.blue("Empty");
                this.world.queueDestroy(boxEntity);
            } else {
                term.moveTo(0, 26).eraseLine.green("You found the ^yananas^ !");
                term.processExit(0);
            }
        }
    }

    // And some registration...
    const world = new World()
        .registerComponent(Open)
        .addSystem(new OpenSystem())
        // ...

Lastly, we add a handler for putting the `Open` component onto the Hero if we press space or Enter:

    // ... term.on('key', ...
    } else if ([" ", "ENTER"].includes(name)) {
        const hero = world.getGlobal(Entity);
        hero.add(new Open());
    } else {
    // ...

That about does it. If you walk around and press space or enter on the boxes you can open them. When you find the ananas, the game is over and you win!

You can find the full code to this part [here](../part2c.ts)

The next part of the tutorial is [here](./part3.md)
