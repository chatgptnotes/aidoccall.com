/**
 * Jest Test Setup for Autonomous Agent
 * Configures test environment for agent functionality
 */

// Mock browser environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => null),
    removeItem: jest.fn(() => null),
    clear: jest.fn(() => null)
  },
  writable: true
});

Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random()
  },
  writable: true
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Material Icons
global.document.querySelector = jest.fn(() => null);
global.document.querySelectorAll = jest.fn(() => []);

// Mock navigation
Object.defineProperty(window, 'navigator', {
  value: {
    geolocation: {
      getCurrentPosition: jest.fn()
    },
    clipboard: {
      writeText: jest.fn(() => Promise.resolve())
    }
  },
  writable: true
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});