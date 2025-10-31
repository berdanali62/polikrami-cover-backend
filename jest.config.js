module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '<rootDir>/test/unit/**/*.test.ts',
    '<rootDir>/test/integration/**/*.test.ts',
    '<rootDir>/test/performance/**/*.test.ts',
    '<rootDir>/test/**/*.e2e.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/app.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/modules/**/controller/**',
    '!src/modules/**/dto/**',
    '!src/modules/**/middlewares/**',
    '!src/modules/**/repository/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};