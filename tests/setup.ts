// Global test setup - runs before each test file
// Ensures reflect-metadata is available for TypeORM decorators in tests
import 'reflect-metadata';

// Silence logger output during tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
