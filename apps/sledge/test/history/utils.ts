import { Anvil, rawToWebp } from '@sledge/anvil';
import { expect, vi } from 'vitest';
import { PaletteType, selectPalette, setColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import type { ImagePoolEntry } from '~/features/image_pool';
import type { Layer } from '~/features/layer';
import { BlendMode, LayerType } from '~/features/layer';
import { registerLayerAnvil } from '~/features/layer/anvil/AnvilManager';
import { setCanvasStore, setImagePoolStore, setLayerListStore } from '~/stores/ProjectStores';

// Common test constants following naming convention
export const TEST_CONSTANTS = {
  CONTEXT: 'test-action',
  CANVAS_SIZE: { width: 32, height: 32 },
  TILE_SIZE: 32,
} as const;

// Layer creation utilities
export function createTestLayer(id: string, name?: string): Layer {
  return {
    id,
    name: name ?? `Layer ${id}`,
    type: LayerType.Dot,
    typeDescription: 'dot',
    enabled: true,
    opacity: 1,
    mode: BlendMode.normal,
    dotMagnification: 1,
  };
}

// Create multiple test layers with alphabetical IDs
export function createTestLayers(count: number): Layer[] {
  const layers: Layer[] = [];
  for (let i = 0; i < count; i++) {
    const id = String.fromCharCode(65 + i); // A, B, C, D...
    layers.push(createTestLayer(id));
  }
  return layers;
}

// Dummy WebP buffer creation
export function createDummyWebpBuffer(customData?: number[]): Uint8Array {
  const defaultData = [
    0x52,
    0x49,
    0x46,
    0x46, // RIFF
    0x20,
    0x00,
    0x00,
    0x00, // file size
    0x57,
    0x45,
    0x42,
    0x50, // WEBP
    0x56,
    0x50,
    0x38,
    0x20, // VP8
    0x14,
    0x00,
    0x00,
    0x00, // chunk size
    0x30,
    0x01,
    0x00,
    0x9d,
    0x01,
    0x2a,
    0x0a,
    0x00,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ];
  return new Uint8Array(customData ?? defaultData);
}

// Create WebP buffer from raw data
export function createWebpFromRaw(rawData: Uint8ClampedArray, width: number, height: number): Uint8Array {
  return rawToWebp(new Uint8Array(rawData.buffer), width, height);
}

// ImagePoolEntry creation utilities
export function createTestEntry(
  id: string,
  options?: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    webpBuffer?: Uint8Array;
    originalPath?: string;
  }
): ImagePoolEntry {
  const { width = 10, height = 10, x = 0, y = 0, webpBuffer = createDummyWebpBuffer(), originalPath } = options ?? {};

  return {
    id,
    originalPath,
    webpBuffer,
    base: { width, height },
    transform: { x, y, scaleX: 1, scaleY: 1, rotation: 0 },
    opacity: 1,
    visible: true,
  };
}

// Create multiple test entries with alphabetical naming
export function createTestEntries(count: number): ImagePoolEntry[] {
  const entries: ImagePoolEntry[] = [];
  for (let i = 0; i < count; i++) {
    const letter = String.fromCharCode(65 + i); // A, B, C, D...
    entries.push(createTestEntry(`entry-${letter}`));
  }
  return entries;
}

// Anvil setup utilities
export function setupTestAnvil(layerId: string, width = 32, height = 32, tileSize = 32): Anvil {
  const anvil = new Anvil(width, height, tileSize);
  registerLayerAnvil(layerId, anvil);
  return anvil;
}

// Store setup utilities
export function setupBasicStores(): void {
  // Reset layer store with basic layers
  const layers = createTestLayers(3); // A, B, C
  setLayerListStore('layers', layers);
  setLayerListStore('activeLayerId', 'A');

  // Reset image pool
  setImagePoolStore('entries', []);
  setImagePoolStore('selectedEntryId', undefined);

  // Reset canvas
  setCanvasStore('canvas', TEST_CONSTANTS.CANVAS_SIZE);

  // Reset color
  selectPalette(PaletteType.primary);
  setColor(PaletteType.primary, '#000000');
}

// History controller setup
export function setupHistoryController(): void {
  projectHistoryController.clearHistory();
}

// Complete test environment setup
export function setupTestEnvironment(): void {
  vi.clearAllMocks();
  setupBasicStores();
  setupHistoryController();
}

// Store state assertion helpers
export function getLayerFromStore(index: number): Layer | undefined {
  let layer: Layer | undefined;
  setLayerListStore((state: any) => {
    layer = state.layers[index];
    return state;
  });
  return layer;
}

export function getAllLayersFromStore(): Layer[] {
  let layers: Layer[] = [];
  setLayerListStore((state: any) => {
    layers = [...state.layers];
    return state;
  });
  return layers;
}

export function getLayerIdsFromStore(): string[] {
  return getAllLayersFromStore().map((l) => l.id);
}

// Mock setup utilities
export function setupCommonMocks(): void {
  // Document mock for environments that need it
  if (typeof document === 'undefined') {
    (globalThis as any).document = {
      createElement: vi.fn(),
      getElementById: vi.fn(),
    };
  }
}

// Mock configurations that can be imported
export const COMMON_MOCKS = {
  FloatingMoveManager: {
    floatingMoveManager: {
      isMoving: () => false,
      cancel: vi.fn(),
    },
  },
  SelectionOperator: {
    cancelMove: vi.fn(),
  },
  EventBus: {
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  },
  SelectionAreaManager: {
    selectionManager: {
      isSelected: vi.fn(() => false),
      getFloatingBuffer: vi.fn(),
      setState: vi.fn(),
    },
    getCurrentSelection: vi.fn(() => ({
      getBoundBox: vi.fn(),
      getMask: vi.fn(() => new Uint8Array()),
    })),
  },
  Layer: {
    activeLayer: vi.fn(() => ({ id: 'test-layer' })),
  },
  Tools: {
    TOOL_CATEGORIES: {
      RECT_SELECTION: 'rect_selection',
    },
    toolCategories: [],
  },
  EditorStores: {
    toolStore: {
      selectionLimitMode: 'none',
    },
  },
} as const;

// Assertion helpers for common test patterns
export function expectLayerOrder(expectedIds: string[]): void {
  const actualIds = getLayerIdsFromStore();
  expect(actualIds).toEqual(expectedIds);
}

export function expectHistoryState(canUndo: boolean, canRedo: boolean): void {
  expect(projectHistoryController.canUndo()).toBe(canUndo);
  expect(projectHistoryController.canRedo()).toBe(canRedo);
}

// Re-export commonly needed test utilities
export { expect, vi } from 'vitest';
