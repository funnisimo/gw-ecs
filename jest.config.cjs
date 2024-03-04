/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  coverageDirectory: "./coverage",
  collectCoverageFrom: ["src/**"],
  setupFilesAfterEnv: ["jest-extended/all"],
  testEnvironment: "node",

  // [...]
  preset: "ts-jest/presets/default-esm", // or other ESM presets
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};

// module.exports = {
//   preset: "ts-jest",
//   moduleFileExtensions: ["js", "json", "ts", "node", "mjs"],
// };
