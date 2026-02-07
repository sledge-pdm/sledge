import { ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImagePoolRemoveCommand } from '~/features/history/command/image_pool/ImagePoolRemoveCommand';
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

describe('ImagePoolRemoveCommand (e2e)', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
    setImagePoolImages(new Map());
  });

  it('removes entries forward and restores them backward at index', () => {
    const entry = buildEntry('entry-2', 'sample');
    const image = buildImage();
    setProjectStore('imagePool', 'entries', [entry]);
    setImagePoolImages(new Map([['entry-2', image]]));

    const command = new ImagePoolRemoveCommand({ entry, image, index: 0 });

    command.forward();
    expect(projectStore.imagePool.entries).toHaveLength(0);

    command.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['entry-2']);
    expect(imagePoolImages().get('entry-2')).toEqual(image);
    expect(command.getContext().description).toContain('sample');
  });

  it('restores by index and clamps when image is missing', () => {
    const entries = [buildEntry('a'), buildEntry('b'), buildEntry('c')];
    setProjectStore('imagePool', 'entries', entries);

    const command = new ImagePoolRemoveCommand({ entry: entries[1], index: 1 });
    command.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['a', 'c']);

    command.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(imagePoolImages().get('b')).toBeUndefined();

    const clampCommand = new ImagePoolRemoveCommand({ entry: entries[1], index: 999 });
    clampCommand.forward();
    clampCommand.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['a', 'c', 'b']);
  });
});
