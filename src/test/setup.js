import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.crypto for bcrypt/hashing if needed in tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => arr.fill(0),
  },
});
