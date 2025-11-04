import { describe, expect, it } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry, removeEntry } from '~/features/image_pool';

describe('ImagePoolHistoryAction', () => {
  it('undo/redo add/remove keeps id with insertEntry()', async () => {
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

    const entry: ImagePoolEntry = {
      id: 'fixed-id',
      originalPath: 'C:/dummy.png',
      webpBuffer: dummyWebpBuffer,
      base: { width: 10, height: 10 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      opacity: 1,
      visible: true,
    };
    insertEntry(entry);
    removeEntry(entry.id, false);
    expect(getEntry('fixed-id')).toBeUndefined();
    projectHistoryController.undo();
    expect(getEntry('fixed-id')).toBeDefined();
    projectHistoryController.redo();
    expect(getEntry('fixed-id')).toBeUndefined();

    // cleanup
    removeEntry('fixed-id');
  });
});
