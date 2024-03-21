import terminal from "terminal-kit";

const term = terminal.terminal;
term.clear();

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
