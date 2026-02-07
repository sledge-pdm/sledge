import { ImagePoolEntry } from '@sledge-pdm/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImagePoolPropsCommand } from '~/features/history/command/image_pool/ImagePoolPropsCommand';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const buildEntry = (id: string, name = id): ImagePoolEntry => ({
  id,
  base: { width: 1, height: 1 },
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
  opacity: 1,
  visible: true,
  descriptionName: name,
});

describe('ImagePoolPropsCommand (e2e)', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
  });

  it('applies entry prop changes forward/backward', () => {
    const entry = buildEntry('entry-1', 'sample');
    setProjectStore('imagePool', 'entries', [entry]);

    const before = { ...entry };
    const after = { ...entry, visible: false, opacity: 0.5, transform: { ...entry.transform, x: 10, y: 5 } };

    const command = new ImagePoolPropsCommand({
      entryId: entry.id,
      before,
      after,
    });

    command.forward();
    expect(projectStore.imagePool.entries[0].visible).toBe(false);
    expect(projectStore.imagePool.entries[0].opacity).toBe(0.5);
    expect(projectStore.imagePool.entries[0].transform.x).toBe(10);

    command.backward();
    expect(projectStore.imagePool.entries[0].visible).toBe(true);
    expect(projectStore.imagePool.entries[0].opacity).toBe(1);
    expect(projectStore.imagePool.entries[0].transform.x).toBe(0);

    const context = command.getContext();
    expect(context.description).toContain('sample');
    expect(context.icon).toBe('/assets/icons/actions/image.png');
  });

  it('no-ops when missing before/after or entry', () => {
    const entry = buildEntry('entry-1', 'sample');
    setProjectStore('imagePool', 'entries', [entry]);

    const noProps = new ImagePoolPropsCommand({ entryId: entry.id });
    noProps.forward();
    noProps.backward();
    expect(projectStore.imagePool.entries[0]).toEqual(entry);

    const missing = new ImagePoolPropsCommand({
      entryId: 'missing',
      before: entry,
      after: { ...entry, opacity: 0.5 },
    });
    missing.forward();
    missing.backward();
    expect(projectStore.imagePool.entries[0]).toEqual(entry);
  });
});
