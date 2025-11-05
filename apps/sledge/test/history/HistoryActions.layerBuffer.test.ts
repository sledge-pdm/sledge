import { beforeEach, describe, it } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { flushPatch, setPixel } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import './mocks';
import { expect, expectHistoryState, setupTestAnvil, setupTestEnvironment, TEST_CONSTANTS } from './utils';

describe('AnvilLayerHistoryAction', () => {
  const layerId = 'A';

  beforeEach(() => {
    setupTestEnvironment();
    setupTestAnvil(layerId, TEST_CONSTANTS.CANVAS_SIZE.width, TEST_CONSTANTS.CANVAS_SIZE.height, TEST_CONSTANTS.TILE_SIZE);
  });

  it('undo/redo whole buffer change restores data', () => {
    const anvil = getAnvilOf(layerId)!;
    const before = anvil.getBufferCopy();
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
    const action = new AnvilLayerHistoryAction({ layerId, patch: patch! });

    // Test undo (revert to original state)
    action.undo();
    const reverted = anvil.getBufferCopy();
    expect(reverted[0]).toBe(originalCopy[0]);

    // Test redo (re-apply changes)
    action.redo();
    const reApplied = anvil.getBufferCopy();
    expect(reApplied[0]).toBe(128);
  });

  it('pixel patch writes individual pixels and can be undone', () => {
    const anvil = getAnvilOf(layerId)!;
    const beforeCopy = anvil.getBufferCopy().slice();

    // Set pixels with different colors
    setPixel(layerId, 1, 1, [255, 0, 0, 255]); // Red
    setPixel(layerId, 2, 1, [0, 255, 0, 255]); // Green

    const patch = flushPatch(layerId)!;
    const action = new AnvilLayerHistoryAction({ layerId, patch });

    // Verify pixels were set
    expect(anvil.getPixel(1, 1)[0]).toBe(255);

    // Test undo
    action.undo();
    expect(anvil.getPixel(1, 1)[0]).toBe(beforeCopy[(1 + 1 * TEST_CONSTANTS.CANVAS_SIZE.width) * 4]);

    // Test redo
    action.redo();
    expect(anvil.getPixel(2, 1)[1]).toBe(255);
  });

  it('history controller pushes and undoes Anvil patches', () => {
    setPixel(layerId, 0, 0, [9, 9, 9, 255]);
    const patch = flushPatch(layerId)!;

    projectHistoryController.addAction(new AnvilLayerHistoryAction({ layerId, patch }));
    expectHistoryState(true, false);

    projectHistoryController.undo();
    const anvil = getAnvilOf(layerId)!;
    expect(anvil.getPixel(0, 0)[3]).toBe(0); // alpha back to 0 after undo
    projectHistoryController.redo();
    expect(anvil.getPixel(0, 0)[0]).toBe(9);
    expectHistoryState(true, false);
  });
});
