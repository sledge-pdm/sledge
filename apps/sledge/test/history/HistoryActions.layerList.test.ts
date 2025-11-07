import { beforeEach, describe, it } from 'vitest';
import { LayerListHistoryAction } from '~/features/history';
import { LayerListReorderHistoryAction } from '~/features/history/actions/LayerListReorderHistoryAction';
import './mocks';
import { createTestLayer, createWebpFromRaw, expectLayerOrder, setupTestEnvironment, TEST_CONSTANTS } from './utils';

describe('LayerListHistoryAction', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('redo add inserts snapshot at index; undo removes it', () => {
    const buf = new Uint8ClampedArray([1, 2, 3, 4]);
    const snapshot = {
      layer: createTestLayer('X'),
      image: { webpBuffer: createWebpFromRaw(buf, 1, 1), width: 1, height: 1 },
    };
    const action = new LayerListHistoryAction({
      kind: 'add',
      index: 1,
      packedSnapshot: snapshot,
      context: TEST_CONSTANTS.CONTEXT,
    });

    action.redo();
    expectLayerOrder(['A', 'X', 'B', 'C']);

    action.undo();
    expectLayerOrder(['A', 'B', 'C']);
  });

  it('redo delete removes by id; undo re-inserts snapshot at index', () => {
    expectLayerOrder(['A', 'B', 'C']);

    const buf = new Uint8ClampedArray([1, 2, 3, 4]);
    const snapshot = {
      layer: createTestLayer('D'),
      image: { webpBuffer: createWebpFromRaw(buf, 1, 1), width: 1, height: 1 },
    };
    const action = new LayerListHistoryAction({
      kind: 'delete',
      index: 3,
      packedSnapshot: snapshot,
      context: TEST_CONSTANTS.CONTEXT,
    });

    action.undo();
    expectLayerOrder(['A', 'B', 'C', 'D']);

    action.redo();
    expectLayerOrder(['A', 'B', 'C']);
  });

  it('reorder applies afterOrder on redo and beforeOrder on undo', () => {
    const before = ['A', 'B', 'C'];
    const after = ['C', 'A', 'B'];
    const action = new LayerListReorderHistoryAction({
      beforeOrder: before,
      afterOrder: after,
      context: TEST_CONSTANTS.CONTEXT,
    });

    action.redo();
    expectLayerOrder(after);

    action.undo();
    expectLayerOrder(before);
  });
});
