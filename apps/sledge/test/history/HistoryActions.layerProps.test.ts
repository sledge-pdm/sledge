import { beforeEach, describe, it } from 'vitest';
import { LayerPropsHistoryAction } from '~/features/history';
import type { Layer } from '~/features/layer';
import { BlendMode, LayerType } from '~/features/layer';
import { setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import './mocks';
import { createTestLayer, expect, getLayerFromStore, setupTestEnvironment, TEST_CONSTANTS, vi } from './utils';

describe('LayerPropsHistoryAction', () => {
  const layerId = 'A';
  const baseLayer = createTestLayer(layerId, 'Layer A');

  beforeEach(() => {
    setupTestEnvironment();
    // Spy on eventBus.emit
    vi.spyOn(eventBus, 'emit');
    // Seed store with a single layer
    setLayerListStore('layers', [baseLayer]);
    setLayerListStore('activeLayerId', layerId);
  });

  it('redo applies new props, undo restores old props, and emits update', () => {
    const oldProps: Omit<Layer, 'id'> = { ...baseLayer, id: undefined as any } as any;
    const newProps: Omit<Layer, 'id'> = {
      name: 'Layer A - Renamed',
      type: LayerType.Dot,
      typeDescription: 'dot',
      enabled: false,
      opacity: 0.5,
      mode: BlendMode.multiply,
      dotMagnification: 2,
      cutFreeze: false,
    };

    const action = new LayerPropsHistoryAction({
      layerId,
      oldLayerProps: oldProps,
      newLayerProps: newProps,
      context: TEST_CONSTANTS.CONTEXT,
    });

    action.redo();
    const afterRedo = getLayerFromStore(0);
    expect(afterRedo).toBeDefined();
    expect(afterRedo!.name).toBe('Layer A - Renamed');
    expect(afterRedo!.enabled).toBe(false);
    expect(afterRedo!.opacity).toBe(0.5);
    expect(afterRedo!.mode).toBe(BlendMode.multiply);
    expect(afterRedo!.dotMagnification).toBe(2);

    // event emitted
    expect(eventBus.emit).toHaveBeenCalledWith('webgl:requestUpdate', { context: TEST_CONSTANTS.CONTEXT, onlyDirty: false });

    action.undo();
    const afterUndo = getLayerFromStore(0);
    expect(afterUndo!.name).toBe('Layer A');
    expect(afterUndo!.enabled).toBe(true);
    expect(afterUndo!.opacity).toBe(1);
    expect(afterUndo!.mode).toBe(BlendMode.normal);
    expect(afterUndo!.dotMagnification).toBe(1);
    expect(eventBus.emit).toHaveBeenCalledWith('webgl:requestUpdate', { context: TEST_CONSTANTS.CONTEXT, onlyDirty: false });
  });
});
