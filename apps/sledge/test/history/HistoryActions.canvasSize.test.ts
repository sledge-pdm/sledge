import { describe, expect, it, vi } from 'vitest';
import { CanvasSizeHistoryAction } from '~/features/history';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';

// Mock 'document' if used in CanvasSizeHistoryAction or related code
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    // Add minimal stubs as needed for your code
    createElement: vi.fn(),
    getElementById: vi.fn(),
    // ...add more if required
  };
}

describe('CanvasSizeHistoryAction', () => {
  it('undo/redo updates canvas size value', () => {
    const oldSize = { width: 100, height: 80 } as const;
    const newSize = { width: 120, height: 90 } as const;
    const act = new CanvasSizeHistoryAction({ beforeSize: oldSize, afterSize: newSize, context: { from: 'test' } });
    // redoing CanvasSizeHistoryActions no longer means apply resizing.
    // act.redo();

    act.registerBefore();

    setCanvasStore('canvas', newSize);
    allLayers().forEach((l) => getAnvilOf(l.id)?.resize(newSize.width, newSize.height));

    act.registerAfter();

    expect(canvasStore.canvas.width).toBe(newSize.width);
    expect(canvasStore.canvas.height).toBe(newSize.height);
    act.undo();
    expect(canvasStore.canvas.width).toBe(oldSize.width);
    expect(canvasStore.canvas.height).toBe(oldSize.height);
  });
});
