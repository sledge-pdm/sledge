import { Anvil } from '@sledge/anvil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { ConvertSelectionHistoryAction } from '~/features/history/actions/ConvertSelectionHistoryAction';
import { ImagePoolEntry } from '~/features/image_pool';
import { registerLayerAnvil } from '~/features/layer/anvil/AnvilManager';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';

vi.mock('~/features/selection/FloatingMoveManager', () => ({
  floatingMoveManager: {
    isMoving: () => false,
    cancel: vi.fn(),
  },
}));

vi.mock('~/features/selection/SelectionOperator', () => ({
  cancelMove: vi.fn(),
}));

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

vi.mock('~/features/layer', () => ({
  activeLayer: vi.fn(() => ({ id: 'test-layer' })),
}));

vi.mock('~/features/tools/Tools', () => ({
  TOOL_CATEGORIES: {
    RECT_SELECTION: 'rect_selection',
  },
  toolCategories: [],
}));

vi.mock('~/stores/EditorStores', () => ({
  toolStore: {
    selectionLimitMode: 'none',
  },
}));

describe('ConvertSelectionHistoryAction', () => {
  const layerId = 'convert-selection-test-layer';

  beforeEach(() => {
    projectHistoryController.clearHistory();
    // Clear image pool
    setImagePoolStore('entries', []);
    // Register test layer
    registerLayerAnvil(layerId, new Anvil(32, 32, 32));
  });

  it('converts selection to image without delete (copy)', () => {
    // Create dummy WebP buffer for testing
    const dummyWebpBuffer = new Uint8Array([
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
    ]);

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'converted-image-1',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 10, height: 10 },
      transform: { x: 5, y: 5, scaleX: 1, scaleY: 1, rotation: 0 },
      opacity: 1,
      visible: true,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    // Set up the new state (after conversion)
    setImagePoolStore('entries', newEntries);

    const action = new ConvertSelectionHistoryAction({
      layerId,
      oldEntries,
      newEntries,
      // No patch for copy operation (no deletion)
    });

    expect(imagePoolStore.entries).toHaveLength(1);
    expect(imagePoolStore.entries[0].id).toBe('converted-image-1');

    // Test undo - should remove the converted image
    action.undo();
    expect(imagePoolStore.entries).toHaveLength(0);

    // Test redo - should restore the converted image
    action.redo();
    expect(imagePoolStore.entries).toHaveLength(1);
    expect(imagePoolStore.entries[0].id).toBe('converted-image-1');
    expect(imagePoolStore.entries[0].transform.x).toBe(5);
    expect(imagePoolStore.entries[0].transform.y).toBe(5);
  });

  it('converts selection to image with delete (cut) - tests image pool behavior', () => {
    // Create dummy WebP buffer for testing
    const dummyWebpBuffer = new Uint8Array([
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
    ]);

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'converted-image-cut',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 2, height: 2 },
      transform: { x: 5, y: 5, scaleX: 1, scaleY: 1, rotation: 0 },
      opacity: 1,
      visible: true,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    // Create a mock patch for cut operation
    const mockPatch = {
      pixels: [],
      tiles: [],
      whole: undefined,
    };

    // Set up the image pool state (after conversion)
    setImagePoolStore('entries', newEntries);

    const action = new ConvertSelectionHistoryAction({
      layerId,
      oldEntries,
      newEntries,
      patch: mockPatch, // Include patch for cut operation (deletion)
    });

    expect(imagePoolStore.entries).toHaveLength(1);

    // Test undo - should remove image (patch restoration is handled by AnvilHistoryAction separately)
    action.undo();
    expect(imagePoolStore.entries).toHaveLength(0);

    // Test redo - should add image back
    action.redo();
    expect(imagePoolStore.entries).toHaveLength(1);
    expect(imagePoolStore.entries[0].id).toBe('converted-image-cut');
  });

  it('serializes and deserializes correctly', () => {
    const dummyWebpBuffer = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'serialization-test',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 8, height: 8 },
      transform: { x: 10, y: 15, scaleX: 1.5, scaleY: 2.0, rotation: 45 },
      opacity: 0.8,
      visible: false,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    const action = new ConvertSelectionHistoryAction({
      layerId,
      oldEntries,
      newEntries,
      context: { tool: 'rect_selection' },
      label: 'Convert Selection to Image',
    });

    const serialized = action.serialize();

    expect(serialized.type).toBe('convert_selection');
    expect((serialized.props as any).layerId).toBe(layerId);
    expect((serialized.props as any).oldEntries).toEqual(oldEntries);
    expect((serialized.props as any).newEntries).toEqual(newEntries);
    expect(serialized.props.context).toEqual({ tool: 'rect_selection' });
    expect(serialized.props.label).toBe('Convert Selection to Image');
  });

  it('handles existing image pool entries correctly', () => {
    // Set up existing entries
    const existingEntry: ImagePoolEntry = {
      id: 'existing-image',
      originalPath: 'test.png',
      webpBuffer: new Uint8Array([0x00, 0x01, 0x02]),
      base: { width: 16, height: 16 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      opacity: 1,
      visible: true,
    };

    const newConvertedEntry: ImagePoolEntry = {
      id: 'converted-from-selection',
      originalPath: undefined,
      webpBuffer: new Uint8Array([0x52, 0x49, 0x46, 0x46]),
      base: { width: 4, height: 4 },
      transform: { x: 8, y: 8, scaleX: 1, scaleY: 1, rotation: 0 },
      opacity: 1,
      visible: true,
    };

    const oldEntries = [existingEntry];
    const newEntries = [existingEntry, newConvertedEntry];

    // Set initial state
    setImagePoolStore('entries', oldEntries);

    const action = new ConvertSelectionHistoryAction({
      layerId,
      oldEntries,
      newEntries,
    });

    // Apply conversion (add new entry)
    action.redo();
    expect(imagePoolStore.entries).toHaveLength(2);
    expect(imagePoolStore.entries.find((e) => e.id === 'existing-image')).toBeDefined();
    expect(imagePoolStore.entries.find((e) => e.id === 'converted-from-selection')).toBeDefined();

    // Undo conversion (remove new entry)
    action.undo();
    expect(imagePoolStore.entries).toHaveLength(1);
    expect(imagePoolStore.entries[0].id).toBe('existing-image');

    // Redo conversion (add new entry back)
    action.redo();
    expect(imagePoolStore.entries).toHaveLength(2);
  });

  it('works with project history controller', () => {
    const dummyWebpBuffer = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'history-controller-test',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 12, height: 12 },
      transform: { x: 20, y: 25, scaleX: 1, scaleY: 1, rotation: 0 },
      opacity: 1,
      visible: true,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    const action = new ConvertSelectionHistoryAction({
      layerId,
      oldEntries,
      newEntries,
    });

    // Set the state after conversion
    setImagePoolStore('entries', newEntries);

    projectHistoryController.addAction(action);
    expect(projectHistoryController.canUndo()).toBe(true);
    expect(imagePoolStore.entries).toHaveLength(1);

    // Test undo through controller
    projectHistoryController.undo();
    expect(imagePoolStore.entries).toHaveLength(0);
    expect(projectHistoryController.canRedo()).toBe(true);

    // Test redo through controller
    projectHistoryController.redo();
    expect(imagePoolStore.entries).toHaveLength(1);
    expect(imagePoolStore.entries[0].id).toBe('history-controller-test');
  });
});
