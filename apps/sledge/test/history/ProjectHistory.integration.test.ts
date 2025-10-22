import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { currentColor, PaletteType, selectPalette, setColor, setCurrentColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry } from '~/features/image_pool';
import { canvasStore, setImagePoolStore } from '~/stores/ProjectStores';

// Mock 'document' if used in CanvasSizeHistoryAction or related code
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    // Add minimal stubs as needed for your code
    createElement: vi.fn(),
    getElementById: vi.fn(),
    // ...add more if required
  };
}

describe('Project-level history integration', () => {
  beforeEach(() => {
    // Reset color to a known state
    selectPalette(PaletteType.primary);
    setColor(PaletteType.primary, '#000000');
    // Reset imagePool store
    setImagePoolStore('entries', []);
    setImagePoolStore('selectedEntryId', undefined);
  });

  it('sequential actions: apply -> push -> full undo -> full redo', () => {
    const hc = projectHistoryController;
    hc.clearHistory(); // Clear history before test
    const LOG_SEQ = process.env.VITEST_LOG_SEQ === '1';
    const logs: string[] = [];

    const initialCanvas = { ...canvasStore.canvas };
    const targetCanvas = { width: initialCanvas.width + 10, height: initialCanvas.height - 20 };
    const entry: ImagePoolEntry = {
      id: 'int-fixed',
      imagePath: 'C:/dummy.png',
      base: { width: 10, height: 10 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      opacity: 1,
      visible: true,
    };

    // 1) Apply actual operations
    setCurrentColor('#ff0000');
    if (LOG_SEQ) logs.push('Color #000000 -> #ff0000');

    changeCanvasSizeWithNoOffset(targetCanvas);
    if (LOG_SEQ) logs.push(`Canvas ${initialCanvas.width}x${initialCanvas.height} -> ${targetCanvas.width}x${targetCanvas.height}`);

    insertEntry(entry);
    if (LOG_SEQ) logs.push('ImagePool add int-fixed');

    // Verify present state
    expect(currentColor()).toBe('#ff0000');
    expect(canvasStore.canvas.width).toBe(targetCanvas.width);
    expect(canvasStore.canvas.height).toBe(targetCanvas.height);
    expect(getEntry('int-fixed')).toBeDefined();

    // Full undo
    while (hc.canUndo()) hc.undo();
    expect(currentColor()).toBe('#000000');
    expect(canvasStore.canvas.width).toBe(initialCanvas.width);
    expect(canvasStore.canvas.height).toBe(initialCanvas.height);
    expect(getEntry('int-fixed')).toBeUndefined();

    // Full redo
    while (hc.canRedo()) hc.redo();
    expect(currentColor()).toBe('#ff0000');
    expect(canvasStore.canvas.width).toBe(targetCanvas.width);
    expect(canvasStore.canvas.height).toBe(targetCanvas.height);
    expect(getEntry('int-fixed')).toBeDefined();

    if (LOG_SEQ) {
      // eslint-disable-next-line no-console
      console.log('\n[seq] steps=3\n' + logs.map((d, i) => `${i + 1}. ${d}`).join('\n'));
    }
  });

  it('idempotency: extra undo/redo beyond bounds should not change state or throw', () => {
    const hc = projectHistoryController;
    hc.clearHistory(); // Clear history before test

    // Apply color change
    setCurrentColor('#ff0000');

    // At this point color is red
    hc.undo();
    // extra undo (no-op)
    hc.undo();
    expect(currentColor()).toBe('#000000');

    hc.redo();
    // extra redo (no-op)
    hc.redo();
    expect(currentColor()).toBe('#ff0000');
  });
});
