/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@generated/(.*)$": "<rootDir>/generated/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.cjs"],
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts", "!**/*.spec.ts"],
  coverageDirectory: "coverage",
};
