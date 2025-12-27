import { beforeEach, describe, it } from 'vitest';
import { LayerListHistoryAction } from '~/features/history';
import { LayerListReorderHistoryAction } from '~/features/history/actions/LayerListReorderHistoryAction';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { HistoryActionTester } from '../../../support/HistoryActionTester';
import { projectFixture } from '../../../support/projectFixture';
import '../mocks';
import { createTestLayer, createTestLayers, createWebpFromRaw, expectLayerOrder, setupTestAnvil, TEST_CONSTANTS } from '../utils';

describe('LayerListHistoryAction', () => {
  beforeEach(() => {
    projectFixture()
      .withCanvas(TEST_CONSTANTS.CANVAS_SIZE)
      .withLayers(createTestLayers(3)) // A, B, C
      .withActiveLayer('A')
      .clearHistory(true)
      .apply();
  });

  it('redo add inserts snapshot at index; undo removes it', () => {
    const buf = new Uint8ClampedArray([1, 2, 3, 4]);
    const snapshot = {
      layer: createTestLayer('X'),
      image: { webpBuffer: createWebpFromRaw(buf, 1, 1), width: 1, height: 1 },
    };
    const tester = new HistoryActionTester(
      () =>
        new LayerListHistoryAction({
          kind: 'add',
          index: 1,
          packedSnapshot: snapshot,
          context: TEST_CONSTANTS.CONTEXT,
        })
    );

    tester.run({
      apply: () => {
        const layers = layerListStore.layers;
        layers.splice(1, 0, snapshot.layer);
        setLayerListStore('layers', layers);
        setupTestAnvil(snapshot.layer.id, TEST_CONSTANTS.CANVAS_SIZE.width, TEST_CONSTANTS.CANVAS_SIZE.height, TEST_CONSTANTS.TILE_SIZE);
      },
      assertAfterApply: () => expectLayerOrder(['A', 'X', 'B', 'C']),
      assertAfterUndo: () => expectLayerOrder(['A', 'B', 'C']),
    });
  });

  it('redo delete removes by id; undo re-inserts snapshot at index', () => {
    expectLayerOrder(['A', 'B', 'C']);

    const buf = new Uint8ClampedArray([1, 2, 3, 4]);
    const snapshot = {
      layer: createTestLayer('D'),
      image: { webpBuffer: createWebpFromRaw(buf, 1, 1), width: 1, height: 1 },
    };
    const tester = new HistoryActionTester(
      () =>
        new LayerListHistoryAction({
          kind: 'delete',
          index: 3,
          packedSnapshot: snapshot,
          context: TEST_CONSTANTS.CONTEXT,
        })
    );

    tester.run({
      apply: () => {
        // 事前状態に D を足してから削除した状態にする
        const layersWithD = [...layerListStore.layers, snapshot.layer];
        setLayerListStore('layers', layersWithD);
        // ユーザー操作: D を削除
        const layersAfterDelete = layersWithD.filter((l) => l.id !== 'D');
        setLayerListStore('layers', layersAfterDelete);
      },
      assertAfterApply: () => expectLayerOrder(['A', 'B', 'C']),
      assertAfterUndo: () => expectLayerOrder(['A', 'B', 'C', 'D']),
    });
  });

  it('reorder applies afterOrder on redo and beforeOrder on undo', () => {
    const before = ['A', 'B', 'C'];
    const after = ['C', 'A', 'B'];
    const tester = new HistoryActionTester(
      () =>
        new LayerListReorderHistoryAction({
          beforeOrder: before,
          afterOrder: after,
          context: TEST_CONSTANTS.CONTEXT,
        })
    );

    tester.run({
      apply: () => {
        const map = new Map(layerListStore.layers.map((l) => [l.id, l] as const));
        const reordered = after.map((id) => map.get(id)!).filter(Boolean);
        setLayerListStore('layers', reordered);
      },
      assertAfterApply: () => expectLayerOrder(after),
      assertAfterUndo: () => expectLayerOrder(before),
    });
  });
});
