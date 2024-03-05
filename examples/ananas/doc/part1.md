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

    term.on("key", function (name, matches, data) {
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

## Empty World

We are building an app that uses our ECS, so the first thing we will need is a `World`. Lets add that and incorporate it into the game loop. Add the following to your `index.ts` file:

    import { World } from "gw-ecs/world";

We are going to add a `global` variable that holds a reference to the terminal object. This will make it easier to pass around the term to our services. Globals are any Javascript Object instance (important: they have a constructor). In our case it is a wrapper class that holds the terminal (we have to do this because the terminal does not have a prototype/constructor).

    class Term {
        term: terminal.Terminal;

        constructor(term: terminal.Terminal) {
            this.term = term;
        }
    }

    // ...
    const world = new World().setGlobal(new Term(term)).start();

    // ...
    function run() {
        world.process(16);
        setTimeout(run, 16);
    }

This creates our `World`, stores the `Term`, and runs its systems every game loop iteration.

## Adding a Map

The next step is to add a map that we can later explore. Our map will be made of `Tile` objects that represent walls and floors.

Now add the following code to `index.ts`:

    import { Aspect, World } from "gw-ecs/world";
    import { System } from "gw-ecs/system";
    import { PosManager } from "gw-ecs/utils";

Next we define our `Tile` component. The `ch` and `attr` are for drawing the tile, the blocks lets us have walls.

    // ...
    class Tile {
        ch: string;
        attr: terminal.ScreenBuffer.Attributes;
        blocks: boolean;

        constructor(ch: string, color: string, blocks = false) {
            this.ch = ch;
            this.attr = { color };
            this.blocks = blocks;
        }
    }

    const WALL = new Tile("#", "gray", true);
    const FLOOR = new Tile(".", "white");

We need to register our component, we also need to add a `PosManager` that will track our entities' positions.

    // ...
    const world = new World()
        // ... existing
        .registerComponent(Tile)
        .setGlobal(new PosManager(80, 25), (w, pm) => pm.init(w))
        .start();

Now lets dig the map using `rot.js` and its `Digger`. We are going to add a function that digs the map and call it via the `World.init` method. Every tile is represented by an `Entity` that has a `Tile` component. The tile is either a wall or a floor.

    function digMap(world: World) {
        const digger = new ROT.Map.Digger(80, 25);
        const posMgr = world.getGlobal(PosManager);

        function digCallback(x: number, y: number, value: number) {
            const tile = value ? WALL : FLOOR;
            posMgr.set(world.create(tile), x, y);
        }

        digger.create(digCallback);
    }

    const world = new World()
        // ... existing
        .init(digMap)
        .start();

Finally, lets add a `System` that draws our map every loop interation. This system creates a `ScreenBuffer` on startup and then draws every tile into the buffer on each loop iteration.

Systems have their `start` method called when the `World.start()` call is made. They can use it to do any initialization code. Our `start` creates a buffer that we will use to do our drawing.

Then, everytime `world.process()` is called, the system's `doProcess` is called if the system is enabled. Our `doProcess` method iterates the `PosManager` and uses the data to fill a buffer with the tile information. Then it draws the buffer onto the terminal.

    const TILE_ASPECT = new Aspect(Tile);

    class DrawSystem extends System {
        _buf!: terminal.ScreenBuffer;

        start(world: World) {
            super.start(world);
            const term = world.getGlobal(Term).term;
            this._buf = new terminal.ScreenBuffer({ width: 80, height: 30, dst: term });
        }

        protected doProcess(): void {
            const buf = this._buf;
            const map = this.world.getGlobal(PosManager);

            map.everyXY((x, y, es) => {
                const tileEntity = es[0]; // Every x,y has a tile so we know we will get an entity
                const tile = tileEntity.fetch(Tile)!;
                buf.put({ x, y, attr: tile.attr, dx: 1, dy: 0, wrap: true }, tile.ch);
            }, TILE_ASPECT);

            buf.draw();
        }
    }

    const world = new World()
        // ... existing
        .addSystem(new DrawSystem())
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

Our game involves moving around the map, looking in boxes until we find the `ananas` (pineapple). So we need to start our level by adding some boxes randomly around the map.

First we need to create our `Box` component and register it...

    class Box {
        ch: string;
        attr: terminal.ScreenBuffer.Attributes;

        constructor() {
            this.ch = "*";
            this.attr = { color: "blue" };
        }
    }

    const BOX_ASPECT = new Aspect(Box);

    // ...
    const world = new World()
        .registerComponent(Box)
        // ...
        .start();

Next, we will update `digMap` to track the floor locations and use them to place the boxes...

    function digMap(world: World) {
        const digger = new ROT.Map.Digger(80, 25);
        const posMgr = world.getGlobal(PosManager);
        const floors: { x: number; y: number }[] = [];

        function digCallback(x: number, y: number, value: number) {
            const tile = value ? WALL : FLOOR;
            posMgr.set(world.create(tile), x, y);

            if (!value) {
                floors.push({ x, y });
            }
        }

        digger.create(digCallback);

        placeBoxes(world, 10, floors);
    }

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
            posMgr.set(world.create(new Box()), loc.x, loc.y);
            count -= 1;
        }
    }

And finally, we have to update our drawing code. The update tries first to draw a box and if not draws a tile. Add the following helper function:

    function ifDo<T>(maybeVal: T, doFn: (t: NonNullable<T>) => any): boolean {
        if (!maybeVal) return false;
        doFn(maybeVal);
        return true;
    }

And update the `doProcess` of our `DrawSystem`...

    protected doProcess(): void {
        const buf = this._buf;
        const map = this.world.getGlobal(PosManager);

        map.everyXY((x, y, es) => {
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

Now you should see something like this:

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
