import terminal from "terminal-kit";
import { World } from "gw-ecs/world/world";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { EntitySystemSet } from "gw-ecs/system/systemSet";
import { System } from "gw-ecs/system";
import { Entity } from "gw-ecs/entity";
import { Aspect } from "gw-ecs/world/aspect";
import { RunResult, Schedule, ScheduleSystem } from "gw-ecs/common/schedule";

class Messages {
  data: string[] = [];

  add(msg: string) {
    this.data.push(msg);
  }

  popAll(): string[] {
    const data = this.data;
    this.data = [];
    return data;
  }
}

class Name {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  toString(): string {
    return this.name;
  }
}

class LogSystem extends EntitySystem {
  name: string;
  constructor(name: string) {
    super(new Aspect(Name));
    this.name = name;
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const name = entity.fetch(Name);
    const nameText = name ? name.name : "unknown";
    const msg = `${this.name} - ${nameText}`;

    world.getUnique(Messages).add(msg);
  }
}

class EntityRescheduleSystem extends EntitySystem {
  constructor() {
    super(new Aspect());
  }

  runEntity(world: World, entity: Entity, time: number, delta: number): void {
    const schedule = world.getUnique(Schedule);
    const actor = entity.fetch(Actor)!;
    schedule.add(entity, actor.actTime);

    const name = entity.fetch(Name);
    const nameText = name ? name.name : "unknown";
    world.getUnique(Messages).add("Rescheduled - " + nameText);
  }
}

class DrawSystem extends System {
  run(world: World, time: number) {
    const msgs = world.getUnique(Messages).popAll();
    const schedule = world.getUnique(Schedule);
    if (msgs.length) {
      msgs.forEach((msg) => {
        term(msg)("\n");
      });
      term.blue(`World: ${time}, Game: ${schedule.time}\n`);
    }
  }
}

type AiFn = (
  world: World,
  entity: Entity,
  time: number,
  delta: number
) => boolean;

class Actor {
  ai: AiFn[] = [];
  actTime = 100; // Default act time - change this to vary actor speeds (100 = normal, 50 = 2 x faster, 200 = 2 x slower)
  ready = false;

  constructor(time: number, ...fns: AiFn[]);
  constructor(...fns: AiFn[]);
  constructor(...args: any[]) {
    if (typeof args[0] === "number") {
      this.actTime = args.shift();
    } else {
      this.actTime = 100;
    }

    args.forEach((fn) => {
      if (typeof fn === "function") {
        this.ai.push(fn);
      }
    });
  }
}

class GameTurn {
  paused = false;
}

class GameTurnSystem extends ScheduleSystem {
  constructor(setName: string) {
    super(setName, (world) => {
      const gameTurn = world.getUnique(GameTurn);
      return !gameTurn.paused;
    });
  }

  start(world: World) {
    super.start(world);
    const schedule = world.getUnique(Schedule);

    const actors = world.getStore(Actor)!;
    actors.forEach((entity, comp) => {
      schedule.add(entity, comp.actTime); // TODO - Randomize a little
    });

    actors.notify({
      compSet: (entity, comp) => {
        schedule.add(entity, comp.actTime); // TODO - Randomize a little
      },
      compRemoved(entity, _comp) {
        schedule.remove(entity);
      },
    });
  }

  runEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): RunResult {
    const actor = entity.fetch(Actor);
    if (!actor) {
      // TODO - Log?
      term("No Actor.\n");
      return RunResult.Ok; // This entity should not be rescheduled
    }

    if (
      !actor.ready &&
      !actor.ai.some((aiFn) => aiFn(world, entity, time, delta))
    ) {
      return RunResult.Retry;
    }
    world.getUnique(Messages).add(`^gRun entity^ - ${entity.index} @ ${time}`);
    actor.ready = false;
    return super.runEntity(world, entity, time, delta);
  }
}

function mobAiFn() {
  return true;
}

const term = terminal.terminal;

term("Hello\n");

const world = new World()
  .registerComponent(Name)
  .registerComponent(Actor)
  .setUnique(new Messages())
  .setUnique(new GameTurn())
  .setUnique(new Schedule())
  .addSystemSet(
    // Lots of ways to add systems to the gameturn system set
    new EntitySystemSet("gameturn", ["start", "move", "act", "finish"])
      .addSystem("start", new LogSystem("start"))
      .addSystem("move", new LogSystem("move")),
    (set) => {
      set
        .addSystem("act", new LogSystem("act"))
        .addSystem("finish", new LogSystem("finish"));
    }
  )
  .addSystem("gameturn", "finish", new EntityRescheduleSystem())
  .addSystem(new GameTurnSystem("gameturn"))
  .addSystem(new DrawSystem())
  .init((w) => {
    const eA = w.create(new Name("a"), new Actor()); // This is our Hero (user controlled)
    w.setUnique(eA); // Store our hero Entity

    w.create(new Name("b"), new Actor(mobAiFn));
    w.create(new Name("c"), new Actor(80, mobAiFn));
    w.create(new Name("d"), new Actor(120, mobAiFn));
  })
  .start(); // TODO - Must 'start' the GameTurn systems!

term.grabInput(true);

term.on("key", function (name: string) {
  if (name === "CTRL_C" || name === "q") {
    term.blue("QUIT\n");
    term.grabInput(false);
    term.processExit(0);
  } else if (name === " " || name === "ENTER") {
    const hero = world.getUnique(Entity);
    const actor = hero.update(Actor)!;
    actor.ready = true; // Hero did something...
    term.green("User Input\n");
  } else {
    term("'key' event: %s\n", name);
    // TODO - Handle input
  }
});

function run() {
  world.addTime(16).runSystems();
  setTimeout(run, 16);
}

run();
