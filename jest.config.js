module.exports = {
    "testEnvironment": "node",
    "roots": [
      "<rootDir>/src"
    ],
    "testPathIgnorePatterns": [
      "^.+\\.helper\\.test\\.ts$"
    ],
    "collectCoverage": false,
    "collectCoverageFrom": [
      "**/*.ts",
      "!**/node_modules/**",
      "!**/types/**",
      "!**/src/test/**",
      "!**/src/**.test.ts"
    ],
    "moduleFileExtensions": [
      "ts",
      "js",
      "json",
      "node"
    ]
}
