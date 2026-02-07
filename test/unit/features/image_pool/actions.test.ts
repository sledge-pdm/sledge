import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const mocks = vi.hoisted(() => ({
  historyAddEntry: vi.fn(),
  logUserInfo: vi.fn(),
  createEntryFromRawBuffer: vi.fn(),
  removeImagePoolBlobUrl: vi.fn(),
}));

vi.mock('~/features/history', () => ({
  historyManager: {
    addEntry: mocks.historyAddEntry,
  },
}));

vi.mock('~/features/log/service', () => ({
  logSystemError: vi.fn(),
  logUserInfo: mocks.logUserInfo,
}));

vi.mock('~/features/image_pool/blobManager', () => ({
  removeImagePoolBlobUrl: mocks.removeImagePoolBlobUrl,
}));

vi.mock('~/features/image_pool/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/features/image_pool/service')>();
  return {
    ...actual,
    createEntryFromRawBuffer: mocks.createEntryFromRawBuffer,
  };
});

import { addImagesFromRawBuffer, insertEntry, removeEntry, updateEntryPartial } from '~/features/image_pool/actions';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';

const createEntry = (id: string) =>
  ({
    id,
    base: { width: 2, height: 2 },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
    opacity: 1,
    visible: true,
    descriptionName: id,
  }) as any;

const createImage = () =>
  ({
    mimeType: 'image/png',
    deflatedBuffer: new Uint8Array([1, 2, 3]),
  }) as any;

describe('image_pool actions', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
    setProjectStore('imagePool', 'state', 'selectedEntryId', undefined);
    setImagePoolImages(new Map());

    mocks.historyAddEntry.mockReset();
    mocks.logUserInfo.mockReset();
    mocks.createEntryFromRawBuffer.mockReset();
    mocks.removeImagePoolBlobUrl.mockReset();
  });

  it('insertEntry upserts entry and registers history by default', () => {
    const entry = createEntry('e1');
    const image = createImage();

    insertEntry(entry, image);

    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['e1']);
    expect(imagePoolImages().get('e1')).toEqual(image);
    expect(mocks.historyAddEntry).toHaveBeenCalledTimes(1);
  });

  it('updateEntryPartial mutates entry and registers history when values changed', () => {
    const entry = createEntry('e1');
    setProjectStore('imagePool', 'entries', [entry]);

    updateEntryPartial('e1', { visible: false }, { register: true });

    expect(mocks.historyAddEntry).toHaveBeenCalledTimes(1);
    expect(projectStore.imagePool.entries[0].visible).toBe(false);
  });

  it('updateEntryPartial skips history when register is false or entry does not exist', () => {
    const entry = createEntry('e1');
    setProjectStore('imagePool', 'entries', [entry]);

    updateEntryPartial('e1', { visible: false }, { register: false });
    updateEntryPartial('missing', { visible: false }, { register: true });

    expect(mocks.historyAddEntry).not.toHaveBeenCalled();
  });

  it('removeEntry updates selectedEntryId to previous entry and removes stored image', () => {
    const e1 = createEntry('e1');
    const e2 = createEntry('e2');
    const i1 = createImage();
    const i2 = createImage();
    setProjectStore('imagePool', 'entries', [e1, e2]);
    setProjectStore('imagePool', 'state', 'selectedEntryId', 'e2');
    setImagePoolImages(
      new Map([
        ['e1', i1],
        ['e2', i2],
      ])
    );

    removeEntry('e2');

    expect(imagePoolImages().has('e2')).toBe(false);
    expect(imagePoolImages().has('e1')).toBe(true);
    expect(projectStore.imagePool.state.selectedEntryId).toBe('e1');
    expect(mocks.removeImagePoolBlobUrl).toHaveBeenCalledWith('e2');
    expect(mocks.historyAddEntry).toHaveBeenCalledTimes(1);
  });

  it('addImagesFromRawBuffer creates image entry and inserts into pool', async () => {
    const entry = createEntry('raw1');
    const image = createImage();
    mocks.createEntryFromRawBuffer.mockResolvedValue({ entry, image });

    await addImagesFromRawBuffer(new Uint8Array(4), 1, 1, false);

    expect(mocks.createEntryFromRawBuffer).toHaveBeenCalledWith(new Uint8Array(4), 1, 1, false);
    expect(imagePoolImages().get('raw1')).toEqual(image);
    expect(mocks.logUserInfo).toHaveBeenCalledWith('Image added to image pool.');
  });
});
