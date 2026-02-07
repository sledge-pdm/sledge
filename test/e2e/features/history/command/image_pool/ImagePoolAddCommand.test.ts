import { ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImagePoolAddCommand } from '~/features/history/command/image_pool/ImagePoolAddCommand';
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

describe('ImagePoolAddCommand (e2e)', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
    setImagePoolImages(new Map());
  });

  it('adds entries forward and removes them backward', () => {
    const entry = buildEntry('entry-1', 'sample');
    const image = buildImage();
    const command = new ImagePoolAddCommand({ entry, image, index: 0 });

    command.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['entry-1']);
    expect(imagePoolImages().get('entry-1')).toEqual(image);

    command.backward();
    expect(projectStore.imagePool.entries).toHaveLength(0);
    expect(imagePoolImages().get('entry-1')).toBeUndefined();
    expect(command.getContext().description).toContain('sample');
  });

  it('clamps index and supports missing images', () => {
    const existing = [buildEntry('a'), buildEntry('b')];
    setProjectStore('imagePool', 'entries', existing);

    const endEntry = buildEntry('end');
    const endCommand = new ImagePoolAddCommand({ entry: endEntry, index: 999 });
    endCommand.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['a', 'b', 'end']);
    expect(imagePoolImages().get('end')).toBeUndefined();

    endCommand.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['a', 'b']);

    const headEntry = buildEntry('head');
    const headCommand = new ImagePoolAddCommand({ entry: headEntry, index: -1 });
    headCommand.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['head', 'a', 'b']);
  });
});
