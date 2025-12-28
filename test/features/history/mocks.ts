import { vi } from 'vitest';

vi.mock('~/utils/EventBus', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('~/features/selection/SelectionAreaManager', () => ({
  selectionManager: {
    isSelected: vi.fn(() => false),
    getFloatingBuffer: vi.fn(),
    setState: vi.fn(),
  },
  getCurrentSelection: vi.fn(() => ({
    getBoundBox: vi.fn(),
    getMask: vi.fn(() => new Uint8Array()),
  })),
}));

// Document mock for environments that need it
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: vi.fn(),
    getElementById: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  };
}

// Window and other global mocks that might be needed
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
    cancelAnimationFrame: vi.fn(),
  };
}
