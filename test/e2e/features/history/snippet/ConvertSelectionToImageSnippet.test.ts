import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FrascoLayerCommand } from '~/features/history/command/frasco/FrascoLayerCommand';
import { convertSelectionToImageSnippet } from '~/features/history/command/snippet/ConvertSelectionToImageCommands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const buildEntry = (id: string, name = id): ImagePoolEntry => ({
  id,
  base: { width: 2, height: 2 },
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
  opacity: 1,
  visible: true,
  descriptionName: name,
});

const buildImage = (): ImagePoolImage => ({
  mimeType: 'image/png',
  deflatedBuffer: new Uint8Array([1, 2, 3]),
});

const buildMask = (width: number, height: number, onIndex = 0): SelectionMask => {
  const mask = new SelectionMask(width, height);
  const data = new Uint8Array(width * height);
  data[onIndex] = 1;
  mask.setMask(data);
  return mask;
};

describe('ConvertSelectionToImageCommands snippet (e2e)', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
    setImagePoolImages(new Map());
    selectionManager.clearAll();
  });

  afterEach(() => {
    selectionManager.clearAll();
  });

  it('adds image pool entry and swaps selection on redo/undo', () => {
    const existing = buildEntry('existing');
    setProjectStore('imagePool', 'entries', [existing]);
    setImagePoolImages(new Map([[existing.id, buildImage()]]));

    const originalBack = buildMask(2, 2, 1);
    selectionManager.setBack(originalBack);
    selectionManager.setFront(buildMask(2, 2, 2));

    const entry = buildEntry('new', 'from selection');
    const image = buildImage();
    const selectionBefore = buildMask(2, 2, 0);

    const { commands, context } = convertSelectionToImageSnippet({
      entry,
      image,
      index: 1,
      layerId: 'layer-1',
      selectionBefore,
      deleteAfter: false,
    });
    const historyEntry = new CommandsHistoryEntry(commands, context);

    historyEntry.redo();
    expect(projectStore.imagePool.entries.map((item) => item.id)).toEqual(['existing', 'new']);
    expect(imagePoolImages().get('new')).toEqual(image);
    expect(selectionManager.getFront()).toBeUndefined();
    expect(Array.from(selectionManager.getBack()?.getMask() ?? [])).toEqual(Array.from(selectionBefore.getMask()));

    historyEntry.undo();
    expect(projectStore.imagePool.entries.map((item) => item.id)).toEqual(['existing']);
    expect(imagePoolImages().get('new')).toBeUndefined();
    expect(selectionManager.getFront()).toBeUndefined();
    expect(Array.from(selectionManager.getBack()?.getMask() ?? [])).toEqual(Array.from(originalBack.getMask()));
  });

  it('includes frasco layer command when deleteAfter is true', () => {
    const entry = buildEntry('new');
    const image = buildImage();
    const selectionBefore = buildMask(1, 1, 0);

    const { commands, context } = convertSelectionToImageSnippet({
      entry,
      image,
      index: 0,
      layerId: 'layer-1',
      selectionBefore,
      deleteAfter: true,
    });

    expect(commands[0]?.command).toBeInstanceOf(FrascoLayerCommand);
    expect(context?.description).toContain('cut');
  });
});
