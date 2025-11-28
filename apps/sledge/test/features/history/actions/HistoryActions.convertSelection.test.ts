import { Anvil } from '@sledge/anvil';
import { readFileSync } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { ConvertSelectionHistoryAction } from '~/features/history/actions/ConvertSelectionHistoryAction';
import { ImagePoolEntry } from '~/features/image_pool';
import { registerLayerAnvil } from '~/features/layer/anvil/AnvilManager';
import { imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { HistoryActionTester } from '../../../support/HistoryActionTester';

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
    const dummyWebpBuffer = readFileSync(new URL('./images/convertSelection_copy.webp', import.meta.url));

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'converted-image-1',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 10, height: 10 },
      transform: { x: 5, y: 5, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    // Set up the new state (after conversion)
    setImagePoolStore('entries', newEntries);

    const tester = new HistoryActionTester(
      () =>
        new ConvertSelectionHistoryAction({
          layerId,
          oldEntries,
          newEntries,
          // No patch for copy operation (no deletion)
        })
    );

    tester.run({
      apply: () => {
        // conversion後の状態を直接セット
        setImagePoolStore('entries', newEntries);
      },
      assertAfterApply: () => {
        expect(imagePoolStore.entries).toHaveLength(1);
        expect(imagePoolStore.entries[0].id).toBe('converted-image-1');
      },
      assertAfterUndo: () => {
        expect(imagePoolStore.entries).toHaveLength(0);
      },
      assertAfterRedo: () => {
        expect(imagePoolStore.entries).toHaveLength(1);
        expect(imagePoolStore.entries[0].id).toBe('converted-image-1');
        expect(imagePoolStore.entries[0].transform.x).toBe(5);
        expect(imagePoolStore.entries[0].transform.y).toBe(5);
      },
    });
  });

  it('converts selection to image with delete (cut) - tests image pool behavior', () => {
    const dummyWebpBuffer = readFileSync(new URL('./images/convertSelection_cut.webp', import.meta.url));

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'converted-image-cut',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 2, height: 2 },
      transform: { x: 5, y: 5, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
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

    const tester = new HistoryActionTester(
      () =>
        new ConvertSelectionHistoryAction({
          layerId,
          oldEntries,
          newEntries,
          patch: mockPatch, // Include patch for cut operation (deletion)
        })
    );

    tester.run({
      apply: () => {
        setImagePoolStore('entries', newEntries);
      },
      assertAfterApply: () => expect(imagePoolStore.entries).toHaveLength(1),
      assertAfterUndo: () => expect(imagePoolStore.entries).toHaveLength(0),
      assertAfterRedo: () => {
        expect(imagePoolStore.entries).toHaveLength(1);
        expect(imagePoolStore.entries[0].id).toBe('converted-image-cut');
      },
    });
  });

  it('serializes and deserializes correctly', () => {
    const dummyWebpBuffer = readFileSync(new URL('./images/convertSelection_serialization.webp', import.meta.url));

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'serialization-test',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 8, height: 8 },
      transform: { x: 10, y: 15, scaleX: 1.5, scaleY: 2.0, rotation: 45, flipX: false, flipY: false },
      opacity: 0.8,
      visible: false,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    const tester = new HistoryActionTester(
      () =>
        new ConvertSelectionHistoryAction({
          layerId,
          oldEntries,
          newEntries,
          context: { tool: 'rect_selection' },
          label: 'Convert Selection to Image',
        })
    );

    const serialized = tester
      .run({
        apply: () => {
          setImagePoolStore('entries', newEntries);
        },
      })
      .serialize();

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
      webpBuffer: readFileSync(new URL('./images/convertSelection_existing.webp', import.meta.url)),
      base: { width: 16, height: 16 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };

    const newConvertedEntry: ImagePoolEntry = {
      id: 'converted-from-selection',
      originalPath: undefined,
      webpBuffer: readFileSync(new URL('./images/convertSelection_copy.webp', import.meta.url)),
      base: { width: 4, height: 4 },
      transform: { x: 8, y: 8, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };

    const oldEntries = [existingEntry];
    const newEntries = [existingEntry, newConvertedEntry];

    // Set initial state
    setImagePoolStore('entries', oldEntries);

    const tester = new HistoryActionTester(
      () =>
        new ConvertSelectionHistoryAction({
          layerId,
          oldEntries,
          newEntries,
        })
    );

    tester.run({
      apply: () => {
        setImagePoolStore('entries', newEntries);
      },
      assertAfterApply: () => {
        expect(imagePoolStore.entries).toHaveLength(2);
        expect(imagePoolStore.entries.find((e) => e.id === 'existing-image')).toBeDefined();
        expect(imagePoolStore.entries.find((e) => e.id === 'converted-from-selection')).toBeDefined();
      },
      assertAfterUndo: () => {
        expect(imagePoolStore.entries).toHaveLength(1);
        expect(imagePoolStore.entries[0].id).toBe('existing-image');
      },
      assertAfterRedo: () => {
        expect(imagePoolStore.entries).toHaveLength(2);
      },
    });
  });

  it('works with project history controller', () => {
    const dummyWebpBuffer = readFileSync(new URL('./images/convertSelection_historyController.webp', import.meta.url));

    const oldEntries: ImagePoolEntry[] = [];
    const newImageEntry: ImagePoolEntry = {
      id: 'history-controller-test',
      originalPath: undefined,
      webpBuffer: dummyWebpBuffer,
      base: { width: 12, height: 12 },
      transform: { x: 20, y: 25, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };
    const newEntries: ImagePoolEntry[] = [newImageEntry];

    const tester = new HistoryActionTester(
      () =>
        new ConvertSelectionHistoryAction({
          layerId,
          oldEntries,
          newEntries,
        })
    );

    tester.run({
      apply: (action) => {
        setImagePoolStore('entries', newEntries);
        projectHistoryController.addAction(action);
        expect(projectHistoryController.canUndo()).toBe(true);
      },
      undo: () => projectHistoryController.undo(),
      redo: () => projectHistoryController.redo(),
      assertAfterApply: () => expect(imagePoolStore.entries).toHaveLength(1),
      assertAfterUndo: () => {
        expect(imagePoolStore.entries).toHaveLength(0);
        expect(projectHistoryController.canRedo()).toBe(true);
      },
      assertAfterRedo: () => {
        expect(imagePoolStore.entries).toHaveLength(1);
        expect(imagePoolStore.entries[0].id).toBe('history-controller-test');
      },
    });
  });
});
