import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneEntry, createEntryFromFile, createEntryFromRawBuffer, getEntry, selectEntry } from '~/features/image_pool/service';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

class ImageDataStub {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

describe('image_pool service', () => {
  const originalImageData = (globalThis as any).ImageData;

  beforeAll(() => {
    (globalThis as any).ImageData = ImageDataStub;
  });

  afterAll(() => {
    (globalThis as any).ImageData = originalImageData;
  });

  beforeEach(() => {
    setProjectStore('canvas', 'size', { width: 4, height: 4 });
    setProjectStore('imagePool', 'entries', []);
    setProjectStore('imagePool', 'state', 'selectedEntryId', undefined);
  });

  it('cloneEntry creates deep copy for nested objects', () => {
    const source = {
      id: 'e1',
      base: { width: 10, height: 20 },
      transform: { x: 1, y: 2, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
      descriptionName: 'name',
    };
    const cloned = cloneEntry(source as any);

    cloned.base.width = 99;
    cloned.transform.x = 100;

    expect(source.base.width).toBe(10);
    expect(source.transform.x).toBe(1);
  });

  it('createEntryFromRawBuffer keeps scale 1 when image fits canvas', async () => {
    const raw = new Uint8Array(2 * 2 * 4);
    const { entry, image } = await createEntryFromRawBuffer(raw, 2, 2, false);

    expect(entry.base).toEqual({ width: 2, height: 2 });
    expect(entry.transform.scaleX).toBe(1);
    expect(entry.transform.scaleY).toBe(1);
    expect(image.mimeType).toBe('image/png');
  });

  it('createEntryFromRawBuffer auto-fits oversized images even when forceFit is false', async () => {
    const raw = new Uint8Array(8 * 4 * 4);
    const { entry } = await createEntryFromRawBuffer(raw, 8, 4, false);

    expect(entry.transform.scaleX).toBe(0.5);
    expect(entry.transform.scaleY).toBe(0.5);
  });

  it('createEntryFromRawBuffer applies forceFit scaling to smaller images', async () => {
    setProjectStore('canvas', 'size', { width: 6, height: 10 });
    const raw = new Uint8Array(2 * 2 * 4);
    const { entry } = await createEntryFromRawBuffer(raw, 2, 2, true);

    expect(entry.transform.scaleX).toBe(3);
    expect(entry.transform.scaleY).toBe(3);
  });

  it('createEntryFromFile normalizes mime type and preserves filename', async () => {
    const createImageBitmapMock = vi.fn(async () => ({
      width: 3,
      height: 2,
      close: vi.fn(),
    }));
    const originalCreateImageBitmap = (globalThis as any).createImageBitmap;
    (globalThis as any).createImageBitmap = createImageBitmapMock;

    try {
      const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpg' });
      const { entry, image } = await createEntryFromFile(file);

      expect(entry.base).toEqual({ width: 3, height: 2 });
      expect(entry.descriptionName).toBe('photo.jpg');
      expect(image.mimeType).toBe('image/jpeg');
      expect(createImageBitmapMock).toHaveBeenCalledTimes(1);
    } finally {
      (globalThis as any).createImageBitmap = originalCreateImageBitmap;
    }
  });

  it('selectEntry and getEntry reflect image pool state', () => {
    const entry = {
      id: 'entry-a',
      base: { width: 1, height: 1 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };
    setProjectStore('imagePool', 'entries', [entry as any]);
    selectEntry('entry-a');

    expect(getEntry('entry-a')?.id).toBe('entry-a');
  });
});
