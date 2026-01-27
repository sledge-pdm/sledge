import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CutPasteCommands } from '~/features/history/command/snippet/CutPasteCommands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { LayerType, type Layer } from '~/features/layer/types';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

vi.mock('~/webgl/service', () => ({
  updateWebGLCanvas: vi.fn(),
  updateLayerPreview: vi.fn(),
}));

vi.mock('~/features/history/actions/utils', async () => {
  const { projectStore } = await import('~/stores/RuntimeProjectStore');
  return {
    getPackedLayerSnapshot: (layerId: string) => {
      const layer = projectStore.layers.layers.find((l) => l.id === layerId);
      if (!layer) return undefined;
      return {
        layer: { ...layer },
        image: {
          packedBuffer: new Uint8Array([1, 2, 3, 4]),
          width: 1,
          height: 1,
        },
      };
    },
    inflateLayerSnapshot: (snapshot: any) => {
      if (!snapshot || !snapshot.image) return undefined;
      const width = snapshot.image.width ?? 1;
      const height = snapshot.image.height ?? 1;
      return {
        layer: snapshot.layer,
        image: {
          buffer: new Uint8ClampedArray(width * height * 4),
          width,
          height,
        },
      };
    },
  };
});

const buildLayer = (id: string, name = id): Layer => ({
  id,
  name,
  type: LayerType.Dot,
  opacity: 1,
  mode: BlendMode.normal,
  enabled: true,
  cutFreeze: false,
});

const resetStore = (layers: Layer[]) => {
  for (const layer of projectStore.layers.layers) {
    layerManager.removeLayer(layer.id);
  }
  setProjectStore('canvas', 'size', { width: 1, height: 1 });
  setProjectStore('layers', 'layers', layers);
  setProjectStore('layers', 'state', 'activeLayerId', layers[0]?.id ?? '');
  setProjectStore('layers', 'state', 'selectionEnabled', false);
  setProjectStore('layers', 'state', 'selected', new Set<string>());
  setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
};

describe('CutPasteCommands snippet', () => {
  beforeEach(() => {
    resetStore([buildLayer('a'), buildLayer('b')]);
  });

  it('reorders layers on redo and restores on undo with order metadata', () => {
    const entry = new CommandsHistoryEntry(CutPasteCommands(1, projectStore.layers.layers[0], new Uint8ClampedArray(4)));

    entry.redo();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['b', 'a']);

    entry.undo();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['a', 'b']);
  });
});
