import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { currentColor, PaletteType, registerColorChange, selectPalette, setCurrentColor, setPaletteColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry } from '~/features/image_pool';
import { canvasStore, setImagePoolStore } from '~/stores/ProjectStores';
import { BLACK, RED } from '../../support/colors';

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
    setPaletteColor(PaletteType.primary, BLACK);
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
    // Create minimal WebP buffer for testing
    const dummyWebpBuffer = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // RIFF
      0x28,
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
      0x4c, // VP8L
      0x1c,
      0x00,
      0x00,
      0x00, // chunk size
      0x2f,
      0x0a,
      0x00,
      0x0a,
      0x00,
      0x88,
      0x88,
      0x08,
      0x8c,
      0x52,
      0x87,
      0x01,
      0x87,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4e,
      0x44,
      0xae,
      0x42,
      0x60,
      0x82,
    ]);

    const entry: ImagePoolEntry = {
      id: 'int-fixed',
      descriptionName: 'dummy.png',
      webpBuffer: dummyWebpBuffer,
      base: { width: 10, height: 10 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };

    // 1) Apply actual operations
    registerColorChange(BLACK, RED);
    setCurrentColor(RED);
    if (LOG_SEQ) logs.push('Color #000000 -> #ff0000');

    changeCanvasSizeWithNoOffset(targetCanvas);
    if (LOG_SEQ) logs.push(`Canvas ${initialCanvas.width}x${initialCanvas.height} -> ${targetCanvas.width}x${targetCanvas.height}`);

    insertEntry(entry);
    if (LOG_SEQ) logs.push('ImagePool add int-fixed');

    // Verify present state
    expect(currentColor()).toStrictEqual(RED);
    expect(canvasStore.canvas.width).toBe(targetCanvas.width);
    expect(canvasStore.canvas.height).toBe(targetCanvas.height);
    expect(getEntry('int-fixed')).toBeDefined();

    // Full undo
    while (hc.canUndo()) hc.undo();
    expect(currentColor()).toStrictEqual(BLACK);
    expect(canvasStore.canvas.width).toBe(initialCanvas.width);
    expect(canvasStore.canvas.height).toBe(initialCanvas.height);
    expect(getEntry('int-fixed')).toBeUndefined();

    // Full redo
    while (hc.canRedo()) hc.redo();
    expect(currentColor()).toStrictEqual(RED);
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
    registerColorChange(BLACK, RED);
    setCurrentColor(RED);

    // At this point color is red
    hc.undo();
    // extra undo (no-op)
    hc.undo();
    expect(currentColor()).toStrictEqual(BLACK);

    hc.redo();
    // extra redo (no-op)
    hc.redo();
    expect(currentColor()).toStrictEqual(RED);
  });
});
