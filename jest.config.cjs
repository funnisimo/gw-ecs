module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["jest-extended/all"],
  coverageDirectory: "./coverage",
  collectCoverageFrom: ["src/**"],
  moduleFileExtensions: ["js", "json", "ts", "node", "mjs"],
};
