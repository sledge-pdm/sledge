// Minimal mocks for UI/Tauri dependent modules so unit tests can run in Node.
import { vi } from 'vitest';

// Mock mitt-based event bus to no-op emit/on during unit tests (avoid importing the real module entirely)
vi.mock('~/utils/EventBus', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

// Mock bottom bar text function but keep other exports (e.g., DebugLogger)
vi.mock('~/controllers/log/LogController', () => ({
  setBottomBarText: vi.fn(),
  DebugLogger: class {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_label: string, _enabled: boolean) {}
    debugLog() {}
    debugWarn() {}
    debugError() {}
  },
}));

// Solid stores: we can import the real stores as they use solid-js/store (no DOM),
// but to avoid side effects on global state between tests, we reset important flags per test if needed.

// Tauri APIs are not needed for these unit tests; stub them generally to prevent import errors if accidentally referenced.
vi.mock('@tauri-apps/api/path', () => ({ pictureDir: vi.fn(async () => 'C:/Pictures') }));
vi.mock('@tauri-apps/plugin-fs', () => ({ exists: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn(), readFile: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ confirm: vi.fn(async () => true), message: vi.fn() }));
vi.mock('@sledge/ui', () => ({}));
vi.mock('@sledge/theme', () => ({
  themeOptions: [
    { label: 'os theme', value: 'os' },
    { label: 'light', value: 'light' },
    { label: 'dark', value: 'dark' },
  ],
}));

// Mock WebGLRenderer consumer modules that import GLSL to avoid Vite parsing GLSL files in node tests
vi.mock('~/webgl/WebGLRenderer', () => ({
  WebGLRenderer: class {
    constructor() {}
  },
}));

vi.mock('@acab/ecsstatic', () => ({
  css: vi.fn(),
}));
