# Ananas aus Caracas, Part 1

We are following the tutorial from RogueBasin on making the Ananas aus Caracas game.

The tutorial can be found [here](https://www.roguebasin.com/index.php/Rot.js_tutorial).

## Setting up the Application

We are going to use `bun` in this example. The installation instructions are [here](https://bun.sh/docs/installation)

Create a directory for the app and initialize a simple application in it:

    mkdir ananas
    cd ananas
    bun init
    bun add terminal-kit
    bun add gw-ecs
    bun add rot-js

Lets start by creating a simple application that will get user keyboard input and will exit cleanly. In `index.ts` add:

    import terminal from "terminal-kit";

    const term = terminal.terminal;

    term.grabInput(true);

    term.on("key", function (name: string) {
        if (name === "CTRL_C" || name === "q") {
            term.blue("QUIT\n");
            term.grabInput(false);
            term.processExit(0);
        } else {
            term("'key' event: %s\n", name);
            // TODO - Handle input
        }
    });

    let running = true;

    function run() {
        setTimeout(run, 16);
    }

    run();

Now we can run the application and see some keyboard events.

    % bun index.ts
    'key' event: h
    'key' event: i
    'key' event: ENTER
    QUIT

    %

We are ready to start building our game.

Here is the [full code](../part1a.ts) so far.

## Creating the Map

We are building an app that uses our ECS, so the first thing we will need is a `World`. Lets add that and incorporate it into the game loop. Add the following imports:

    import { Aspect, World } from "gw-ecs/world";
    import { System } from "gw-ecs/system";
    import { PosManager, Pos } from "gw-ecs/utils";

We are going to add a "global" variable that holds a reference to the terminal object. This will make it easier to pass around the term to our services. ECS globals are any Javascript Object instance (important: they have a constructor). In our case it is a wrapper class that holds the terminal (we have to do this because the terminal does not have a prototype/constructor).

    class Term {
        term: terminal.Terminal;

        constructor(term: terminal.Terminal) {
            this.term = term;
        }
    }

    // ...
    const world = new World().setUnique(new Term(term)).start();

    // ...
    function run() {
        world.addTime(16).runSystems();
        setTimeout(run, 16);
    }

This creates our `World`, stores the `Term`, and runs its systems every game loop iteration.

### Drawing

To make drawing simpler and consistent across many entity types, we are going to have a `Sprite` component that we place on entities.

    // SPRITE

    class Sprite {
        ch: string;
        attr: terminal.ScreenBuffer.Attributes;

        constructor(ch: string, color: string) {
            this.ch = ch;
            this.attr = { color };
        }
    }

    const SPRITE_ASPECT = new Aspect(Sprite);

    const WALL_SPRITE = new Sprite("#", "gray");
    const FLOOR_SPRITE = new Sprite(".", "white");

Not much of interest here, except maybe the fact that we cache our wall and floor sprites for use on many entities.

Any entity with a `Sprite` and a `Pos` will be eligible to be drawn. The drawing will be handled in a system called the `DrawSystem`. This system gets the map info (via the `PosManager`) and iterates over all of the entities that it contains. For each location (x,y) it gets the first entity that has a sprite component and draws that component into the buffer. Then when finished it renders the whole buffer to the terminal.

    // DRAW SYSTEM

    class DrawSystem extends System {
        _buf!: terminal.ScreenBuffer;

        start(world: World) {
            super.start(world);
            const term = world.getUnique(Term).term;
            this._buf = new terminal.ScreenBuffer({ width: 80, height: 30, dst: term });
        }

        protected doProcess(): void {
            const buf = this._buf;
            const map = this.world.getUnique(PosManager);

            map.everyXY((x, y, es) => {
                const entity = SPRITE_ASPECT.first(es)!;

                const sprite = entity.fetch(Sprite)!;
                buf.put({ x, y, attr: sprite.attr, dx: 1, dy: 0, wrap: true }, sprite.ch);
            }, new Aspect(Pos, Sprite));

            buf.draw();
        }
    }

    // ...
    const world = new World()
        .registerComponent(Sprite)
        .setUnique(new Term(term))
        .setUnique(new PosManager(80, 25), (w, r) => r.init(w))
        .addSystem(new DrawSystem())
        .start();

We are now ready to build our map.

### Building the Map

The next step is to add a map that we can later explore. Our map will be made of `Tile` objects that represent walls and floors. Each location on the map will have a `Tile`. Tiles will also have `Sprite` components so that they can be drawn.

Here we define our `Tile` component. The only thing we need to know right now is whether or not the tile blocks movement/sight.

    // ...
    class Tile {
        blocks: boolean;

        constructor(blocks = false) {
            this.blocks = blocks;
        }
    }

    const WALL_TILE = new Tile(true);
    const FLOOR_TILE = new Tile(false);

Now lets dig the map using `rot.js` and its `Digger`. We are going to add a function that digs the map and call it via the `World.init` method. Every tile is represented by an `Entity` that has a `Tile` and a `Sprite` component. The tile is either a wall or a floor.

    function digMap(world: World) {
        const digger = new ROT.Map.Digger(80, 25);
        const posMgr = world.getUnique(PosManager);

        function digCallback(x: number, y: number, blocks: number) {
            const comps = blocks > 0 ? [WALL_TILE, WALL_SPRITE] : [FLOOR_TILE, FLOOR_SPRITE];
            posMgr.set(world.create(...comps), x, y);
        }

        digger.create(digCallback);
    }

    // ... register
    const world = new World()
        .registerComponent(Sprite)
        .registerComponent(Tile)
        .setUnique(new PosManager(80, 25), (w, r) => r.init(w))
        .setUnique(new Term(term))
        .addSystem(new DrawSystem())
        .init(digMap)
        .start();

Now when we run the game we see the map. You will see something like...

    ################################################################################
    ###########........................######.........................##############
    ###########.##########.###########.######.#######################.##############
    ###########.##########.###########.######.#####################....#############
    ###########.##########.###########.######.#####################....#############
    ###########.##########.###########.######.#####################....#############
    ###########.##########.###########.######.#################........#############
    ###########.##########.###########.######.#################.###....#############
    ###########.##########.###########.######.###########.........##################
    ###########.##########.###########.######.###########.........##################
    ###########.##########.###########.........##########.........##################
    ###########.##########.############.###....##############.###.##################
    ###########............############.###........##########.###.##################
    ########################.....######.###....#...##########.###.##################
    ########################.....######.###....#...##########.###.##################
    ########################.......####.###.####...##########.###.###########......#
    ########################.#####.####.....####............#.###.###########.####.#
    #######################....###.####.....###############.#.###.###########.####.#
    #######################....###.####.....###############.#.###.###########.####.#
    #######################....###.####.###.###############.#.###.###########.####.#
    #######################....###.####.###.###############.#...................##.#
    ##############################.####.###...............#.###################.##.#
    ##############################.####.##############....#.###################.##.#
    ##############################......##############......###################....#
    ################################################################################

And if you press `q`, the app will quit.

Here is the [full code](../part1b.ts) so far.

## Adding some boxes

Our game involves moving around the map, looking in boxes until we find the `ananas` (pineapple). So we need to start our world by adding some boxes randomly around the map.

First we need to create our `Box` component and register it...

    class Box {
        ananas: boolean;

        constructor(ananas = false) {
            this.ananas = ananas;
        }
    }

    const BOX_ASPECT = new Aspect(Box);

    // ... Sprite

    const BOX_SPRITE = new Sprite("*", "brightBlue");

    // ...
    const world = new World()
        .registerComponent(Box)
        // ...
        .start();

Next, we will update `digMap` to track the floor locations and use them to place the boxes...

    // A helper interface
    type XY = { x: number; y: number };

    function digMap(world: World) {
        const digger = new ROT.Map.Digger(80, 25);
        const posMgr = world.getUnique(PosManager);
        const floors: XY[] = [];

        function digCallback(x: number, y: number, blocks: number) {
            const comps =
            blocks > 0 ? [WALL_TILE, WALL_SPRITE] : [FLOOR_TILE, FLOOR_SPRITE];
            posMgr.set(world.create(...comps), x, y);

            if (!blocks) floors.push({ x, y });
        }

        digger.create(digCallback);

        placeBoxes(world, 10, floors);
    }

    function placeBoxes(world: World, count: number, locs: XY[]) {
        count = Math.min(count, locs.length);
        const posMgr = world.getUnique(PosManager);

        while (count) {
            var index = Math.floor(ROT.RNG.getUniform() * locs.length);
            var loc = locs.splice(index, 1)[0];
            posMgr.set(world.create(new Box(count == 1), BOX_SPRITE), loc.x, loc.y);
            count -= 1;
        }
    }

And finally, we have to update our drawing code. The update tries first to draw a box and if not draws a tile.

    // ... DrawSystem.doProcess
    map.everyXY((x, y, es) => {
        const entity = BOX_ASPECT.first(es) || TILE_ASPECT.first(es)!;

        const sprite = entity.fetch(Sprite)!;
        buf.put({ x, y, attr: sprite.attr, dx: 1, dy: 0, wrap: true }, sprite.ch);
    }, new Aspect(Sprite));

Now you should see something like this when you run the app:

    ################################################################################
    ################################################################################
    ################################################################################
    ##########################.....#################################........########
    ##########################.......###############################........########
    ##########################.....#.#############################..........########
    ################################.#############################.#........########
    ################################.####################.......##.#################
    ################################.####################.......##.#################
    ############################......###################....*..##.#################
    ############################......######...*..#######.......##.#################
    ############################......######....................##.#################
    ############################..................#######.#####.##.#################
    ############################......######......###.........#........#############
    ########################################......###.........#........#############
    ########################################.########.........#...*....#############
    ########################################....#####.........#####*##.#############
    ###########################......#######..*.#####.......*.####...#.#############
    ###########################......#######....######.###########...#.#############
    ###########################......#######...*#####......#######...#.#############
    ###########################.....*########.#######......#######...#.#############
    ###########################......########.#######......###########.#############
    ###############################.#########.#######......###########.#############
    ###############################*..*.......#######..................#############
    ################################################################################

The '\*' are the boxes.

The full code can be found [here](../part1c.ts)

... Now on to [part 2](./part2.md)
