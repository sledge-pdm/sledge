import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';
import { ProjectHistoryController } from '../controller';

interface DummyActionProps extends BaseHistoryActionProps {
  label?: string;
}
class DummyAction extends BaseHistoryAction {
  readonly type = 'unknown' as const;
  public undoFn = vi.fn();
  public redoFn = vi.fn();
  constructor(props: DummyActionProps) {
    super(props);
  }
  undo(): void {
    this.undoFn();
  }
  redo(): void {
    this.redoFn();
  }
  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {},
    };
  }
}

describe('ProjectHistoryController (unit)', () => {
  let hc: ProjectHistoryController;
  beforeEach(() => {
    hc = new ProjectHistoryController();
  });

  it('addAction pushes to undoStack and clears redoStack', () => {
    const a1 = new DummyAction({ label: 'A1' });
    const a2 = new DummyAction({ label: 'A2' });
    hc.addAction(a1);
    hc.addAction(a2);
    expect(hc.getUndoStack().map((a) => a.label)).toEqual(['A1', 'A2']);
    expect(hc.getRedoStack().length).toBe(0);
  });

  it('undo moves one action from undoStack to redoStack and calls undo()', () => {
    const a1 = new DummyAction({ label: 'A1' });
    hc.addAction(a1);
    hc.undo();
    expect(a1.undoFn).toHaveBeenCalledTimes(1);
    expect(hc.getUndoStack().length).toBe(0);
    expect(hc.getRedoStack().length).toBe(1);
  });

  it('redo moves one action from redoStack back to undoStack and calls redo()', () => {
    const a1 = new DummyAction({ label: 'A1' });
    hc.addAction(a1);
    hc.undo();
    hc.redo();
    expect(a1.redoFn).toHaveBeenCalledTimes(1);
    expect(hc.getUndoStack().length).toBe(1);
    expect(hc.getRedoStack().length).toBe(0);
  });

  it('clearHistory empties both stacks', () => {
    hc.addAction(new DummyAction({}));
    hc.addAction(new DummyAction({}));
    hc.undo(); // populate redo
    hc.clearHistory();
    expect(hc.getUndoStack().length).toBe(0);
    expect(hc.getRedoStack().length).toBe(0);
  });

  it('onChange listener fires with latest label and unsub works', () => {
    const events: any[] = [];
    const off = hc.onChange((s) => events.push(s));
    const a1 = new DummyAction({ label: 'A1' });
    hc.addAction(a1);
    hc.undo();
    hc.redo();
    off();
    hc.addAction(new DummyAction({ label: 'A2' })); // should not be captured
    expect(events.length).toBeGreaterThanOrEqual(3); // initial + add + undo + redo
    const last = events[events.length - 1];
    expect(last.lastLabel).toBe('A1');
  });

  it('isHistoryAvailable reflects stacks state', () => {
    expect(hc.isHistoryAvailable()).toBe(false);
    const a1 = new DummyAction({ label: 'A1' });
    hc.addAction(a1);
    expect(hc.isHistoryAvailable()).toBe(true);
    hc.undo();
    expect(hc.isHistoryAvailable()).toBe(true); // redo available
    hc.redo();
    expect(hc.isHistoryAvailable()).toBe(true);
    hc.undo();
    hc.clearHistory();
    expect(hc.isHistoryAvailable()).toBe(false);
  });
});
