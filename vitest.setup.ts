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

vi.mock('~/utils/VersionUtils', () => ({
  getCurrentVersion: vi.fn(async () => '0.1.5'),
}));

// UI-heavy section tabs are stubbed so config imports stay lightweight in Node tests.
vi.mock('~/config/SectionTabs', () => {
  const createTab = () => () => null;
  return {
    EditorTab: createTab(),
    EffectsTab: createTab(),
    ExplorerTab: createTab(),
    ProjectTab: createTab(),
    ExportTab: createTab(),
    HistoryTab: createTab(),
    PerilousTab: createTab(),
  };
});

// Domain-specific matchers (layer order, canvas size, history state)
import './apps/sledge/test/setupMatchers';

// Solid stores: we can import the real stores as they use solid-js/store (no DOM),
// but to avoid side effects on global state between tests, we reset important flags per test if needed.

// Tauri APIs are not needed for these unit tests; stub them generally to prevent import errors if accidentally referenced.
vi.mock('@tauri-apps/api/path', () => ({ pictureDir: vi.fn(async () => 'C:/Pictures') }));
vi.mock('@tauri-apps/plugin-fs', () => ({ exists: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn(), readFile: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ confirm: vi.fn(async () => true), message: vi.fn() }));
vi.mock('@tauri-apps/plugin-log', () => ({
  info: vi.fn(async () => {}),
  warn: vi.fn(async () => {}),
  error: vi.fn(async () => {}),
}));
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  transformCallback: vi.fn((cb: (...args: any[]) => any) => cb),
  convertFileSrc: vi.fn((path: string) => path),
}));
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

// Tauri ランタイム依存の window オブジェクトを最低限スタブ
if (!(globalThis as any).window) {
  (globalThis as any).window = {} as any;
}
(globalThis as any).window.__TAURI_IPC__ = {
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => path),
  transformCallback: vi.fn((cb: (...args: any[]) => any) => cb),
};

// Node 環境には OffscreenCanvas がないため、参照されても落ちないよう最低限のスタブを用意
if (!(globalThis as any).OffscreenCanvas) {
  class OffscreenCanvasStub {
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return {
        drawImage: vi.fn(),
        putImageData: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(),
          width: this.width,
          height: this.height,
        })),
      } as any;
    }
    convertToBlob = vi.fn(async () => new Blob());
  }
  (globalThis as any).OffscreenCanvas = OffscreenCanvasStub as any;
}
