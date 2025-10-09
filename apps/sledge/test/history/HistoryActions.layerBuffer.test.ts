import { Anvil } from '@sledge/anvil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { fillRect, flushPatch, setPixel } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf, registerLayerAnvil } from '~/features/layer/anvil/AnvilManager';

vi.mock('~/features/selection/FloatingMoveManager', () => ({
  floatingMoveManager: { isMoving: () => false },
}));
vi.mock('~/features/selection/SelectionOperator', () => ({
  cancelMove: vi.fn(),
}));

describe('AnvilLayerHistoryAction', () => {
  const layerId = 'layer-history-test';

  beforeEach(() => {
    projectHistoryController.clearHistory();
    // 手動で Anvil インスタンス作成しマネージャへ登録 (ESM import 利用)
    registerLayerAnvil(layerId, new Anvil(32, 32, 32));
  });

  it('undo/redo whole buffer change restores data', () => {
    const anvil = getAnvilOf(layerId)!;
    const before = anvil.getImageData();
    // simulate effect applying: fill all with color
    const originalCopy = before.slice();
    const after = before.slice();
    after.fill(128);

    // Apply the change to the actual buffer first
    anvil.replaceBuffer(after);
    // Then register the original buffer as swap buffer for undo
    anvil.addWholeDiff(originalCopy);

    const patch = flushPatch(layerId);
    expect(patch).not.toBeNull();
    const action = new AnvilLayerHistoryAction(layerId, patch!);

    // apply redo (already applied logically, but test revert path)
    action.undo();
    const reverted = anvil.getImageData();
    expect(reverted[0]).toBe(originalCopy[0]);

    action.redo();
    const reApplied = anvil.getImageData();
    expect(reApplied[0]).toBe(128);
  });

  it('pixel patch writes individual pixels and can be undone', () => {
    const anvil = getAnvilOf(layerId)!;
    const before = anvil.getImageData();
    const beforeCopy = before.slice();
    setPixel(layerId, 1, 1, [255, 0, 0, 255]);
    setPixel(layerId, 2, 1, [0, 255, 0, 255]);
    const patch = flushPatch(layerId)!;
    const action = new AnvilLayerHistoryAction(layerId, patch);
    expect(getAnvilOf(layerId)!.getPixel(1, 1)[0]).toBe(255);
    action.undo();
    expect(getAnvilOf(layerId)!.getPixel(1, 1)[0]).toBe(beforeCopy[(1 + 1 * 32) * 4]);
    action.redo();
    expect(getAnvilOf(layerId)!.getPixel(2, 1)[1]).toBe(255);
  });

  it('tile fill optimization produces tile patch (treated like multiple pixels)', () => {
    const anvil = getAnvilOf(layerId)!;
    fillRect(layerId, 0, 0, 32, 32, [10, 20, 30, 255]);
    const patch = flushPatch(layerId)!;
    const hasTile = !!patch.tiles && patch.tiles.length >= 1;
    expect(hasTile).toBe(true);
    const action = new AnvilLayerHistoryAction(layerId, patch);
    action.undo();
    // after undo the tile should revert to transparent (initial state)
    const px = anvil.getPixel(0, 0);
    expect(px[3]).toBe(0);
  });

  it('history controller pushes and undoes Anvil patches', () => {
    setPixel(layerId, 0, 0, [9, 9, 9, 255]);
    const patch = flushPatch(layerId)!;
    projectHistoryController.addAction(new AnvilLayerHistoryAction(layerId, patch));
    expect(projectHistoryController.canUndo()).toBe(true);
    projectHistoryController.undo();
    const anvil = getAnvilOf(layerId)!;
    expect(anvil.getPixel(0, 0)[3]).toBe(0); // alpha back to 0 after undo
    projectHistoryController.redo();
    expect(anvil.getPixel(0, 0)[0]).toBe(9);
  });

  it('applyPatch helper symmetry (manual call)', () => {
    const anvil = getAnvilOf(layerId)!;
    // set some pixels -> patch captures before(0) and after(1 / 5)
    setPixel(layerId, 5, 5, [1, 2, 3, 4]);
    setPixel(layerId, 6, 5, [5, 6, 7, 8]);
    const patch = flushPatch(layerId)!;
    // Modify pixels again so applying redo will restore patch effect
    setPixel(layerId, 5, 5, [9, 9, 9, 9]);
    setPixel(layerId, 6, 5, [9, 9, 9, 9]);
    flushPatch(layerId); // discard second patch
    anvil.applyPatch(patch, 'redo'); // apply effect (after values)
    expect(getAnvilOf(layerId)!.getPixel(5, 5)[0]).toBe(1);
    anvil.applyPatch(patch, 'undo'); // apply effect (after values)
    expect(getAnvilOf(layerId)!.getPixel(6, 5)[0]).toBe(0);
  });
});
