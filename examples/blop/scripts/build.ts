#!/usr/bin/env bun
// import { appendFileSync } from "node:fs";

const output = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: false,
  sourcemap: "external",
});

if (!output.success) {
  console.log(output.logs);
  console.log(output.outputs);
} else {
  // append sourcemap link to generated file
  // https://github.com/oven-sh/bun/issues/9314
  // appendFileSync("./dist/index.js", "//# sourceMappingURL=index.js.map\n");

  console.log("Success.");
}
