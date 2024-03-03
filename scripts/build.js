#!/usr/bin/env node

import * as fs from "node:fs";
import * as process from "node:process";
import * as path from "node:path";
import * as child_process from "node:child_process";
import terminal from "terminal-kit";

function getBaseDir() {
  // Find package.json
  let basedir = process.cwd();
  let found = false;
  while (!found && basedir != "/") {
    term("Looking for ^gpackage.json^ : ^b%s", basedir);
    if (fs.existsSync(basedir + "/package.json")) {
      found = true;
    } else {
      basedir = path.join(basedir, "..");
      term.eraseLine().column(0);
    }
  }
  term.eraseLine().column(0);
  if (!found) return null;
  return basedir;
}

const term = terminal.terminal;

const main = async () => {
  const basedir = getBaseDir();
  if (!basedir) {
    term("^rFailed^ to find ^gpackage.json^.\n");
    process.exit(1);
  }
  term("Found ^gpackage.json^ : ^b%s^.\n", basedir);

  // clean the 'dist' dir
  process.chdir(basedir);
  term("Working from ^b%s^.\n", process.cwd());
  if (fs.existsSync("dist")) {
    term("Removing existing ^bdist^ directory.\n");
    fs.rmSync("dist", { recursive: true, force: true });
  }
  term("Creating ^bdist^ directory.\n");
  fs.mkdirSync("dist");

  term("Running ^ytsc^ ...\n");
  try {
    const output = child_process.execSync("npx tsc");
    if (output.length) {
      term(output);
    }
  } catch (err) {
    term("^rCompile failed.\n");
    term.red(err.stdout.toString())("\n");
    process.exit(1);
  }

  term("Copying ^gLICENSE^ to ^bdist\n");
  fs.copyFileSync("LICENSE", "dist/LICENSE");

  term("Copying ^gREADME.md^ to ^bdist\n");
  fs.copyFileSync("README.md", "dist/README.md");

  term("Reading ^gpackage.json\n");
  var packageJson = JSON.parse(fs.readFileSync("package.json"));
  packageJson.devDependencies = {};
  packageJson.scripts = {};
  packageJson.main = "index.js";

  term("Writing updated ^gpackage.json^ to ^bdist\n");
  fs.writeFileSync("dist/package.json", JSON.stringify(packageJson, null, 4));

  term("^gok\n");
};

main();
