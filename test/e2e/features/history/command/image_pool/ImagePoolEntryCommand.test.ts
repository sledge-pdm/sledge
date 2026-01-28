import { beforeEach, describe, expect, it } from 'vitest';
import { ImagePoolEntryCommand } from '~/features/history/command/image_pool/ImagePoolEntryCommand';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const buildEntry = (id: string, name = id): ImagePoolEntry => ({
  id,
  base: { width: 1, height: 1 },
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
  opacity: 1,
  visible: true,
  descriptionName: name,
});

const buildImage = (): ImagePoolImage => ({
  mimeType: 'image/png',
  deflatedBuffer: new Uint8Array([1, 2, 3]),
});

describe('ImagePoolEntryCommand (e2e)', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
    setImagePoolImages(new Map());
  });

  it('adds and removes entries with images', () => {
    const entry = buildEntry('entry-1', 'sample');
    const image = buildImage();
    const command = new ImagePoolEntryCommand({ kind: 'add', entry, image, index: 0 });

    command.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['entry-1']);
    expect(imagePoolImages().get('entry-1')).toEqual(image);

    command.backward();
    expect(projectStore.imagePool.entries).toHaveLength(0);
    expect(imagePoolImages().get('entry-1')).toBeUndefined();
    expect(command.getContext().description).toContain('sample');
  });

  it('restores removed entries at the original index', () => {
    const entry = buildEntry('entry-2');
    const image = buildImage();
    setProjectStore('imagePool', 'entries', [entry]);
    setImagePoolImages(new Map([['entry-2', image]]));

    const command = new ImagePoolEntryCommand({ kind: 'remove', entry, image, index: 0 });

    command.forward();
    expect(projectStore.imagePool.entries).toHaveLength(0);

    command.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['entry-2']);
    expect(imagePoolImages().get('entry-2')).toEqual(image);
  });
});
