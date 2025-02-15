import { vi } from 'vitest'

// Mock browser APIs and globals
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock marked and Prism since they're used in components
vi.mock('marked', () => ({
  default: vi.fn(text => text),
  marked: vi.fn(text => text)
}));

vi.mock('prismjs', () => ({
  default: {
    highlightAll: vi.fn()
  },
  highlightAll: vi.fn()
}));

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks();
}); 