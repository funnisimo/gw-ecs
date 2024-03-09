import terminal from "terminal-kit";
import { World } from "gw-ecs/world/world";
import { EntitySystem } from "gw-ecs/system/entitySystem";
import { EntitySystemSet } from "gw-ecs/system/manager";
import { System } from "gw-ecs/system/system";
import { Entity } from "gw-ecs/entity/entity";
import { Aspect } from "gw-ecs/world";
import { Schedule } from "gw-ecs/utils/schedule";
import { StoreWatcher } from "gw-ecs/component/store";

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

  processEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): void {
    const name = entity.fetch(Name);
    const nameText = name ? name.name : "unknown";
    const msg = `${this.name} - ${nameText}`;

    world.getGlobal(Messages).add(msg);
  }
}

class ScheduleEntitySystem extends EntitySystem {
  constructor() {
    super(new Aspect());
  }

  processEntity(
    world: World,
    entity: Entity,
    time: number,
    delta: number
  ): void {
    const gameTurn = world.getGlobal(GameTurn);
    const actor = entity.fetch(Actor)!;
    gameTurn.schedule.add(entity, actor.actTime);

    const name = entity.fetch(Name);
    const nameText = name ? name.name : "unknown";
    world.getGlobal(Messages).add("Rescheduled - " + nameText);
  }
}

class DrawSystem extends System {
  run(world: World, time: number) {
    const msgs = world.getGlobal(Messages).popAll();
    const gameTurn = world.getGlobal(GameTurn);
    if (msgs.length) {
      msgs.forEach((msg) => {
        term(msg)("\n");
      });
      term.blue(`World: ${time}, Game: ${gameTurn.schedule.time}\n`);
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
  systems: EntitySystemSet;
  schedule: Schedule;
  paused = false;

  constructor() {
    this.systems = new EntitySystemSet("gameturn", [
      "start",
      "move",
      "act",
      "finish",
    ]);
    this.schedule = new Schedule();
  }
}

class GameTurnSystem extends System {
  start(world: World) {
    const gameTurn = world.getGlobal(GameTurn);

    const actors = world.getStore(Actor)!;
    actors.forEach((e, a) => {
      gameTurn.schedule.add(e, a.actTime); // - add to schedule
    });

    actors.notify({
      compSet(entity, comp) {
        gameTurn.schedule.add(entity, comp.actTime);
      },
      compRemoved(entity, _comp) {
        gameTurn.schedule.remove(entity);
      },
    });
  }

  run(world: World, time: number, delta: number) {
    const gameTurn = world.getGlobal(GameTurn);
    if (gameTurn.paused) return;

    let entity = gameTurn.schedule.pop() as Entity | null;
    while (entity) {
      // Check to see if we should break out because of FX or animation or something else that is going on

      // TODO - what to do with delta in gameTurn mode?
      if (!this.runEntity(world, gameTurn, entity, gameTurn.schedule.time, 0)) {
        gameTurn.schedule.restore(entity);
        return;
      }

      if (gameTurn.paused) return;
      entity = gameTurn.schedule.pop() as Entity | null;
    }
  }

  runEntity(
    world: World,
    gameTurn: GameTurn,
    entity: Entity,
    time: number,
    delta: number
  ): boolean {
    const actor = entity.fetch(Actor);
    if (!actor) {
      // TODO - Log?
      term("No Actor.\n");
      return true; // This entity should not be scheduled
    }

    if (
      !actor.ready &&
      !actor.ai.some((aiFn) => aiFn(world, entity, time, delta))
    ) {
      return false;
    }
    world
      .getGlobal(Messages)
      .add(`^gRun entity^ - ${entity.index} @ ${gameTurn.schedule.time}`);
    actor.ready = false;
    gameTurn.systems.runEntity(world, entity, time, delta);
    return true;
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
  .setGlobal(new Messages())
  .setGlobal(new GameTurn(), (gt) => {
    const systems = gt.systems;
    systems
      .addSystem(new LogSystem("start"), "start")
      .addSystem(new LogSystem("move"), "move")
      .addSystem(new LogSystem("act"), "act")
      .addSystem(new LogSystem("finish"), "finish")
      .addSystem(new ScheduleEntitySystem(), "finish");
  })
  .addSystem(new GameTurnSystem())
  .addSystem(new DrawSystem())
  .init((w) => {
    const eA = w.create(new Name("a"), new Actor()); // This is our Hero (user controlled)
    w.setGlobal(eA); // Store our hero Entity

    w.create(new Name("b"), new Actor(mobAiFn));
    w.create(new Name("c"), new Actor(80, mobAiFn));
    w.create(new Name("d"), new Actor(120, mobAiFn));
  })
  .start(); // TODO - Must 'start' the GameTurn systems!

term.grabInput(true);

term.on("key", function (name, matches, data) {
  if (name === "CTRL_C" || name === "q") {
    term.blue("QUIT\n");
    term.grabInput(false);
    term.processExit(0);
  } else if (name === " " || name === "ENTER") {
    const hero = world.getGlobal(Entity);
    const actor = hero.update(Actor)!;
    actor.ready = true; // Hero did something...
    term.green("User Input\n");
  } else {
    term("'key' event: %s\n", name);
    // TODO - Handle input
  }
});

function run() {
  world.runSystems(16);
  setTimeout(run, 16);
}

run();
