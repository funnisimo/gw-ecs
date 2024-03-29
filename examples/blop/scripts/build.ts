const output = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: false,
});

if (!output.success) {
  console.log(output.logs);
  console.log(output.outputs);
} else {
  console.log("Success.");
}
