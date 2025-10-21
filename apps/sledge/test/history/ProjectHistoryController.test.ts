import { describe, expect, it, vi } from 'vitest';
import { BaseHistoryAction, BaseHistoryActionProps, ProjectHistoryController, SerializedHistoryAction } from '~/features/history';

interface TestActionProps extends BaseHistoryActionProps {
  label: string;
}

class TestAction extends BaseHistoryAction {
  readonly type = 'unknown' as const;
  public didUndo = false;
  public didRedo = false;
  constructor(props: TestActionProps) {
    super(props);
  }
  undo(): void {
    this.didUndo = true;
  }
  redo(): void {
    this.didRedo = true;
  }
  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: this.props,
    };
  }
}

describe('ProjectHistoryController', () => {
  it('push/undo/redo updates stacks and calls action methods', () => {
    const hc = new ProjectHistoryController();
    const a1 = new TestAction({ label: 'A1' });
    const a2 = new TestAction({ label: 'A2' });

    expect(hc.canUndo()).toBe(false);
    expect(hc.canRedo()).toBe(false);

    hc.addAction(a1);
    hc.addAction(a2);
    expect(hc.canUndo()).toBe(true);
    expect(hc.getUndoStack().length).toBe(2);
    expect(hc.getRedoStack().length).toBe(0);

    hc.undo();
    expect(a2.didUndo).toBe(true);
    expect(hc.getUndoStack().length).toBe(1);
    expect(hc.getRedoStack().length).toBe(1);
    expect(hc.canRedo()).toBe(true);

    hc.redo();
    expect(a2.didRedo).toBe(true);
    expect(hc.getUndoStack().length).toBe(2);
    expect(hc.getRedoStack().length).toBe(0);
  });

  it('onChange emits state with lastLabel', () => {
    const hc = new ProjectHistoryController();
    const a1 = new TestAction({ label: 'Label1' });
    const listener = vi.fn();
    const off = hc.onChange(listener);

    // initial emit
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual({ canUndo: false, canRedo: false, lastLabel: undefined });

    hc.addAction(a1);
    expect(listener).toHaveBeenCalledTimes(2);
    const state = listener.mock.calls[1][0];
    expect(state.canUndo).toBe(true);
    expect(state.lastLabel).toBe('Label1');

    off();
  });
});
