import { beforeEach, describe, it } from 'vitest';
import { LayerPropsHistoryAction } from '~/features/history';
import type { Layer } from '~/features/layer';
import { BlendMode, LayerType } from '~/features/layer';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { HistoryActionTester } from '../../../support/HistoryActionTester';
import { projectFixture } from '../../../support/projectFixture';
import '../mocks';
import { createTestLayer, expect, TEST_CONSTANTS, vi } from '../utils';

describe('LayerPropsHistoryAction', () => {
  const layerId = 'A';
  const baseLayer = createTestLayer(layerId, 'Layer A');

  beforeEach(() => {
    projectFixture().withCanvas(TEST_CONSTANTS.CANVAS_SIZE).withLayers([baseLayer]).withActiveLayer(layerId).clearHistory(true).apply();
    // Spy on eventBus.emit
    vi.spyOn(eventBus, 'emit');
  });

  it('redo applies new props, undo restores old props, and emits update', () => {
    const oldLayer = layerListStore.layers[0];
    expect(oldLayer).toBeDefined();

    const oldProps: Omit<Layer, 'id'> = oldLayer!;
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

    const tester = new HistoryActionTester(
      () =>
        new LayerPropsHistoryAction({
          layerId,
          context: TEST_CONSTANTS.CONTEXT,
        })
    );

    const isPropsEqual = (layer: Layer, props: Omit<Layer, 'id'>) => {
      for (const key in props) {
        if ((layer as any)[key] !== (props as any)[key]) {
          return false;
        }
      }
      return true;
    };

    tester.run({
      apply: (action) => {
        action.registerBefore();
        setLayerListStore('layers', 0, { id: layerId, ...newProps });
        action.registerAfter();
      },
      assertAfterApply: () => {
        const applied = layerListStore.layers[0];
        expect(applied).toBeDefined();
        expect(isPropsEqual(applied!, newProps)).toBe(true);
      },
      assertAfterUndo: () => {
        const afterUndo = layerListStore.layers[0];
        expect(afterUndo).toBeDefined();
        expect(isPropsEqual(afterUndo!, oldProps)).toBe(true);
        expect(eventBus.emit).toHaveBeenCalledWith('webgl:requestUpdate', {
          context: TEST_CONSTANTS.CONTEXT,
          onlyDirty: false,
        });
      },
      assertAfterRedo: () => {
        const afterRedo = layerListStore.layers[0];
        expect(afterRedo).toBeDefined();
        expect(isPropsEqual(afterRedo!, newProps)).toBe(true);
        expect(eventBus.emit).toHaveBeenCalledWith('webgl:requestUpdate', {
          context: TEST_CONSTANTS.CONTEXT,
          onlyDirty: false,
        });
      },
    });
  });
});
