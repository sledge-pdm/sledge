import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryManager, type Diff, type DiffAction } from '~/controllers/layer/image/managers/HistoryManager';

const makeTileDiff = (row = 0, column = 0): Diff => ({
  kind: 'tile',
  index: { row, column },
  beforeColor: [1, 2, 3, 4],
  afterColor: [9, 8, 7, 6],
});

describe('HistoryManager', () => {
  let hm: HistoryManager;
  beforeEach(() => {
    hm = new HistoryManager('layer-1');
    hm.clear();
  });

  it('initial state cannot undo/redo', () => {
    expect(hm.canUndo()).toBe(false);
    expect(hm.canRedo()).toBe(false);
    expect(hm.undo()).toBeUndefined();
    expect(hm.redo()).toBeUndefined();
  });

  it('addAction pushes to undo and clears redo', () => {
    const a1: DiffAction = { diffs: new Map([['a', makeTileDiff(0, 0)]]) };
    const a2: DiffAction = { diffs: new Map([['b', makeTileDiff(0, 1)]]) };
    hm.addAction(a1);
    expect(hm.canUndo()).toBe(true);
    hm.addAction(a2);
    // redo remains empty after add
    expect(hm.getRedoStack().length).toBe(0);
    expect(hm.getUndoStack().length).toBe(2);
  });

  it('undo moves action from undo to redo (front) and returns it', () => {
    const a1: DiffAction = { diffs: new Map([['a', makeTileDiff(0, 0)]]) };
    const a2: DiffAction = { diffs: new Map([['b', makeTileDiff(0, 1)]]) };
    hm.addAction(a1);
    hm.addAction(a2);
    const undone = hm.undo();
    expect(undone).toBe(a2);
    expect(hm.getUndoStack().length).toBe(1);
    expect(hm.getRedoStack().length).toBe(1);
    // redo is unshifted (front)
    expect(hm.getRedoStack()[0]).toBe(a2);
  });

  it('redo takes from redo (front) and pushes back to undo', () => {
    const a1: DiffAction = { diffs: new Map([['a', makeTileDiff(0, 0)]]) };
    hm.addAction(a1);
    const undone = hm.undo();
    expect(undone).toBeDefined();
    const redone = hm.redo();
    expect(redone).toBe(a1);
    expect(hm.getUndoStack().length).toBe(1);
    expect(hm.getRedoStack().length).toBe(0);
  });

  it('adding new action after undo clears redo', () => {
    const a1: DiffAction = { diffs: new Map([['a', makeTileDiff(0, 0)]]) };
    const a2: DiffAction = { diffs: new Map([['b', makeTileDiff(0, 1)]]) };
    hm.addAction(a1);
    hm.undo();
    expect(hm.getRedoStack().length).toBe(1);
    hm.addAction(a2);
    expect(hm.getRedoStack().length).toBe(0);
  });
});
