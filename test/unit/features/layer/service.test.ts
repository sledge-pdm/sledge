import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it } from 'vitest';
import { deselectLayer, getOperationTargetLayerIds, resetSelectionState, selectLayer, summarizeLayerNames } from '~/features/layer/service';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const layer = (id: string, name = id) => ({
  id,
  name,
  type: 1 as any,
  enabled: true,
  opacity: 1,
  mode: BlendMode.normal,
  cutFreeze: false,
});

describe('layer service', () => {
  beforeEach(() => {
    setProjectStore('layers', 'layers', [layer('l1', 'Layer A'), layer('l2', 'Layer B'), layer('l3', 'Layer C'), layer('l4', 'Layer D')]);
    setProjectStore('layers', 'state', 'activeLayerId', 'l2');
    setProjectStore('layers', 'state', 'selectionEnabled', false);
    setProjectStore('layers', 'state', 'selected', new Set<string>());
    setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
  });

  it('getOperationTargetLayerIds prioritizes selected layers when selection is enabled', () => {
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l3', 'l1']));

    expect(getOperationTargetLayerIds()).toEqual(['l1', 'l3']);
    expect(getOperationTargetLayerIds(undefined, { order: 'desc' })).toEqual(['l3', 'l1']);
  });

  it('getOperationTargetLayerIds falls back to active layer when selection is empty', () => {
    expect(getOperationTargetLayerIds()).toEqual(['l2']);
    expect(getOperationTargetLayerIds(undefined, { fallbackToActive: false })).toEqual([]);
  });

  it('getOperationTargetLayerIds de-duplicates explicit layer ids and drops unknown ids', () => {
    expect(getOperationTargetLayerIds(['l3', 'l1', 'l3', 'unknown'])).toEqual(['l1', 'l3']);
  });

  it('selectLayer and deselectLayer update selected set only for existing layers', () => {
    selectLayer('l1');
    selectLayer('missing');
    expect(Array.from(projectStore.layers.state.selected)).toEqual(['l1']);

    deselectLayer('l1');
    expect(Array.from(projectStore.layers.state.selected)).toEqual([]);
  });

  it('resetSelectionState clears selected set and disables selection mode', () => {
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l1', 'l2']));

    resetSelectionState();

    expect(projectStore.layers.state.selectionEnabled).toBe(false);
    expect(Array.from(projectStore.layers.state.selected)).toEqual([]);
    expect(getOperationTargetLayerIds(undefined, { fallbackToActive: false })).toEqual([]);
  });

  it('summarizeLayerNames returns compact text for more than three layers', () => {
    expect(summarizeLayerNames(['l1', 'l2', 'l3'])).toBe('Layer A, Layer B, Layer C');
    expect(summarizeLayerNames(['l1', 'l2', 'l3', 'l4'])).toBe('Layer A, Layer B, Layer C... (+1)');
  });
});
