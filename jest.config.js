module.exports = {
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  roots: ['<rootDir>/src', '<rootDir>/bin'],
  testPathIgnorePatterns: ['^.+\\.helper\\.test\\.ts$'],
  collectCoverage: false,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/types/**',
    '!**/src/test/**',
    '!**/src/**.test.ts',
    '!**/bin/**.test.ts'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  }
}
