import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use hoisted container so vi.mock factories can reference them safely
const h = vi.hoisted(() => ({
  agentMock: {
    canUndo: vi.fn(() => true),
    undoAction: vi.fn(),
    redoAction: vi.fn(),
  } as any,
  isMoveStateMock: vi.fn(() => false),
  cancelMoveMock: vi.fn(),
}));

vi.mock('~/controllers/layer/LayerAgentManager', () => ({
  getAgentOf: vi.fn(() => h.agentMock),
}));
vi.mock('~/controllers/selection/SelectionManager', () => ({
  selectionManager: { isMoveState: h.isMoveStateMock },
}));
vi.mock('~/controllers/selection/SelectionOperator', () => ({
  cancelMove: h.cancelMoveMock,
}));

import { Diff, LayerBufferHistoryAction } from '~/controllers/history/actions/LayerBufferHistoryAction';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';

describe('LayerBufferHistoryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Recreate agentMock to avoid stale/undefined state
    h.agentMock = {
      canUndo: vi.fn(() => true),
      undoAction: vi.fn(),
      redoAction: vi.fn(),
    } as any;
    // Reset hoisted mocks
    h.isMoveStateMock.mockReset().mockReturnValue(false);
    h.cancelMoveMock.mockReset();
    (getAgentOf as any).mockReset?.();
    (getAgentOf as any).mockReturnValue(h.agentMock);
  });

  const layerId = 'layer-xyz';

  function makeDiffs(): Diff[] {
    return [
      // duplicate pixel at same position; last one should win in Map
      { kind: 'pixel', position: { x: 1, y: 2 }, before: [0, 0, 0, 0], after: [255, 0, 0, 255] },
      { kind: 'pixel', position: { x: 1, y: 2 }, before: [0, 0, 0, 0], after: [0, 255, 0, 255] },
      { kind: 'tile', index: { row: 0, column: 0 }, beforeColor: undefined, afterColor: [1, 2, 3, 4] },
      { kind: 'whole', before: new Uint8ClampedArray([0, 0, 0, 0]), after: new Uint8ClampedArray([9, 9, 9, 9]) },
    ];
  }

  it('redo passes Map(diffs) to agent with last-wins for duplicate pixels', () => {
    const action = new LayerBufferHistoryAction(layerId, { diffs: makeDiffs() }, 'test');

    let redoArg: any;
    h.agentMock.redoAction.mockImplementation((arg: any) => (redoArg = arg));

    action.redo();

    expect(h.agentMock.redoAction).toHaveBeenCalledTimes(1);
    expect(redoArg).toBeDefined();
    expect(redoArg.diffs instanceof Map).toBe(true);
    // Expect 3 unique keys: one pixel (last wins), one tile, one whole
    expect(redoArg.diffs.size).toBe(3);

    // Check that the pixel entry stored is the last one (after: [0,255,0,255])
    // Pixel hash for (1,2) is 1*100000+2 = 100002
    const px = redoArg.diffs.get(100002);
    expect(px).toBeDefined();
    expect(px.after).toEqual([0, 255, 0, 255]);
  });

  it('undo passes Map(diffs) to agent', () => {
    const action = new LayerBufferHistoryAction(layerId, { diffs: makeDiffs() }, 'test');

    let undoArg: any;
    h.agentMock.undoAction.mockImplementation((arg: any) => (undoArg = arg));

    action.undo();

    expect(h.agentMock.undoAction).toHaveBeenCalledTimes(1);
    expect(undoArg).toBeDefined();
    expect(undoArg.diffs instanceof Map).toBe(true);
    expect(undoArg.diffs.size).toBe(3);
  });

  it('selection move state cancels move and does not call agent', () => {
    h.isMoveStateMock.mockReturnValue(true);
    const action = new LayerBufferHistoryAction(layerId, { diffs: makeDiffs() }, 'test');

    action.redo();

    expect(h.cancelMoveMock).toHaveBeenCalledTimes(1);
    expect(h.agentMock.redoAction).not.toHaveBeenCalled();
  });

  it('does nothing if no agent found', () => {
    // Force mocked getAgentOf to return undefined for this case
    (getAgentOf as any).mockReturnValue(undefined);
    const action = new LayerBufferHistoryAction(layerId, { diffs: makeDiffs() }, 'test');

    action.redo();
    action.undo();

    // nothing thrown; nothing called
    // expectations implicit via no-throw, and no available mock to assert calls
  });

  it('respects insertion order: whole first then pixel when provided in that order', () => {
    const diffs: Diff[] = [
      { kind: 'whole', before: new Uint8ClampedArray([0]), after: new Uint8ClampedArray([1]) },
      { kind: 'pixel', position: { x: 0, y: 0 }, before: [0, 0, 0, 0], after: [1, 1, 1, 1] },
    ];
    const action = new LayerBufferHistoryAction(layerId, { diffs }, 'test');

    let order: string[] = [];
    h.agentMock.redoAction.mockImplementation((arg: any) => {
      arg.diffs.forEach((d: Diff) => order.push(d.kind));
    });

    action.redo();
    expect(order).toEqual(['whole', 'pixel']);
  });

  it('duplicate tile index is resolved last-wins in Map', () => {
    const diffs: Diff[] = [
      { kind: 'tile', index: { row: 2, column: 3 }, beforeColor: [0, 0, 0, 0], afterColor: [10, 10, 10, 10] },
      { kind: 'tile', index: { row: 2, column: 3 }, beforeColor: [0, 0, 0, 0], afterColor: [20, 20, 20, 20] },
    ];
    const action = new LayerBufferHistoryAction(layerId, { diffs }, 'test');

    let seen: Diff[] = [];
    h.agentMock.redoAction.mockImplementation((arg: any) => {
      arg.diffs.forEach((d: Diff) => seen.push(d));
    });

    action.redo();
    expect(seen.length).toBe(1);
    const t = seen[0] as any;
    expect(t.kind).toBe('tile');
    expect(t.afterColor).toEqual([20, 20, 20, 20]);
  });

  it('when agent.canUndo() is false, undo/redo are no-ops for agent', () => {
    h.agentMock.canUndo.mockReturnValue(false);
    const action = new LayerBufferHistoryAction(layerId, { diffs: makeDiffs() }, 'test');

    action.redo();
    action.undo();

    expect(h.agentMock.redoAction).not.toHaveBeenCalled();
    expect(h.agentMock.undoAction).not.toHaveBeenCalled();
  });

  it('dedup smoke: many pixel diffs collapse to unique positions', () => {
    const diffs: Diff[] = [];
    for (let i = 0; i < 1000; i++) {
      const x = i % 10; // only 10x10 unique positions
      const y = Math.floor(i / 10) % 10;
      diffs.push({ kind: 'pixel', position: { x, y }, before: [0, 0, 0, 0], after: [i % 255, 0, 0, 255] });
    }
    const action = new LayerBufferHistoryAction(layerId, { diffs }, 'test');

    let size = 0;
    h.agentMock.redoAction.mockImplementation((arg: any) => {
      size = arg.diffs.size;
    });

    action.redo();
    // 10 x 10 unique positions
    expect(size).toBe(100);
  });
});
