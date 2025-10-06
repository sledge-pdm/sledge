import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerListHistoryAction } from '~/features/history';
import type { Layer } from '~/features/layer';
import * as layerModule from '~/features/layer';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';

const { BlendMode, LayerType } = layerModule;

describe('LayerListHistoryAction', () => {
  const l = (id: string, name = id): Layer => ({
    id,
    name,
    type: LayerType.Dot,
    typeDescription: 'dot',
    enabled: true,
    opacity: 1,
    mode: BlendMode.normal,
    dotMagnification: 1,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setLayerListStore('layers', [l('A'), l('B'), l('C')]);
    setLayerListStore('activeLayerId', 'A');
  });

  it('redo add inserts snapshot at index; undo removes it', () => {
    const snapshot = { ...l('X'), buffer: new Uint8ClampedArray([1, 2, 3, 4]) };
    const a = new LayerListHistoryAction('add', 1, snapshot, undefined, undefined, 'test');
    a.redo();
    expect(layerListStore.layers.map((x) => x.id)).toEqual(['A', 'X', 'B', 'C']);

    a.undo();
    expect(layerListStore.layers.map((x) => x.id)).toEqual(['A', 'B', 'C']);
  });

  it('redo delete removes by id; undo re-inserts snapshot at index', () => {
    const snapshot = { ...l('B') } as Layer & { buffer?: Uint8ClampedArray };
    const a = new LayerListHistoryAction('delete', 1, snapshot, undefined, undefined, 'test');
    a.redo();
    expect(layerListStore.layers.map((x) => x.id)).toEqual(['A', 'C']);

    a.undo();
    expect(layerListStore.layers.map((x) => x.id)).toEqual(['A', 'B', 'C']);
  });

  it('reorder applies afterOrder on redo and beforeOrder on undo', () => {
    const before = ['A', 'B', 'C'];
    const after = ['C', 'A', 'B'];
    const a = new LayerListHistoryAction('reorder', 0, undefined, before, after, 'test');

    a.redo();
    expect(layerListStore.layers.map((x) => x.id)).toEqual(after);

    a.undo();
    expect(layerListStore.layers.map((x) => x.id)).toEqual(before);
  });
});
