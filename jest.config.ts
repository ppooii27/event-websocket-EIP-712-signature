import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: ['server/**/*.ts', '!server/**/*.test.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};

export default config;
