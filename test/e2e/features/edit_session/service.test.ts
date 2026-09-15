import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  beginEditSession,
  exclusiveEditSessionLabels,
  finalizeEditSessions,
  hasExclusiveEditSession,
  interruptEditSessions,
  refuseIfExclusiveEditSession,
  type EditSession,
} from '~/features/edit_session';

describe('features/edit_session (e2e)', () => {
  const ends: (() => void)[] = [];

  /** @description open a session that is exclusive until it settles, the shape almost every gesture has. */
  const open = (label: string, overrides?: Partial<EditSession>) => {
    let exclusive = true;
    const settle = () => {
      exclusive = false;
    };
    const end = beginEditSession({
      label,
      isExclusive: () => exclusive,
      interrupt: settle,
      finalize: settle,
      ...overrides,
    });
    ends.push(end);
    return { end, settle: () => (exclusive = false) };
  };

  afterEach(() => {
    ends.splice(0).forEach((end) => end());
    document.body.innerHTML = '';
  });

  it('reports nothing open when nothing is', () => {
    expect(hasExclusiveEditSession()).toBe(false);
    expect(exclusiveEditSessionLabels()).toEqual([]);
    expect(interruptEditSessions()).toBe(false);
  });

  it('holds a session only for as long as it is open', () => {
    const { end } = open('move');
    expect(hasExclusiveEditSession()).toBe(true);
    expect(exclusiveEditSessionLabels()).toEqual(['move']);

    end();

    expect(hasExclusiveEditSession()).toBe(false);
  });

  it('leaves an open session alone while it is holding nothing', () => {
    // the canvas size frame is a mode that outlives any one drag: it is open the whole time, and only
    // exclusive while a handle is actually under the pointer.
    let underPointer = false;
    const settled = vi.fn();
    ends.push(
      beginEditSession({
        label: 'canvas frame',
        isExclusive: () => underPointer,
        interrupt: settled,
        finalize: settled,
      })
    );

    expect(hasExclusiveEditSession()).toBe(false);
    expect(interruptEditSessions()).toBe(false);
    expect(settled).not.toHaveBeenCalled();

    underPointer = true;

    expect(hasExclusiveEditSession()).toBe(true);
    expect(interruptEditSessions()).toBe(true);
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('settles every session that is holding something', () => {
    const stroke = vi.fn();
    const transform = vi.fn();
    open('stroke', { finalize: stroke });
    open('image transform', { finalize: transform });

    finalizeEditSessions();

    expect(stroke).toHaveBeenCalledTimes(1);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  it('runs the rest even when one of them fails', () => {
    const after = vi.fn();
    open('stroke', {
      finalize: () => {
        throw new Error('could not end the stroke');
      },
    });
    open('layer opacity', { finalize: after });

    expect(() => finalizeEditSessions()).not.toThrow();
    // a gesture that cannot be settled must not leave the opacity entry unregistered as well
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('lets a session close itself as it settles', () => {
    const once = vi.fn();
    let exclusive = true;
    let end: () => void;
    end = beginEditSession({
      label: 'move',
      isExclusive: () => exclusive,
      interrupt: () => {},
      finalize: () => {
        once();
        exclusive = false;
        end();
      },
    });
    ends.push(() => end());

    finalizeEditSessions();
    finalizeEditSessions();

    expect(once).toHaveBeenCalledTimes(1);
  });

  it('does not start a second settling pass inside one already running', () => {
    // settling registers history entries, and those paths run back through the guards that call in here.
    const calls: string[] = [];
    let exclusive = true;
    ends.push(
      beginEditSession({
        label: 'move',
        isExclusive: () => exclusive,
        interrupt: () => {},
        finalize: () => {
          calls.push('finalize');
          // whatever this session's commit touches must not be able to walk the sessions again
          expect(interruptEditSessions()).toBe(false);
          expect(finalizeEditSessions()).toBeUndefined();
          exclusive = false;
        },
      })
    );

    finalizeEditSessions();

    expect(calls).toEqual(['finalize']);
  });

  it('interrupts rather than finalizes when the user reaches for something else', () => {
    const interrupt = vi.fn();
    const finalize = vi.fn();
    open('move', {
      interrupt: () => {
        interrupt();
      },
      finalize,
    });

    // `interrupt` has to say whether it did anything, so undo can spend the press on it and step history
    // only on the next one
    expect(interruptEditSessions()).toBe(true);
    expect(interrupt).toHaveBeenCalledTimes(1);
    expect(finalize).not.toHaveBeenCalled();
  });

  it('commits a focused field before anything reads the project', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    const order: string[] = [];
    input.addEventListener('blur', () => order.push('blur'));
    open('layer opacity', { finalize: () => order.push('session') });

    finalizeEditSessions();

    // blur first: the value a field commits on blur can be what a session then has to register
    expect(order).toEqual(['blur', 'session']);
    expect(document.activeElement).not.toBe(input);
  });

  it('turns an edit down by name while another is open', () => {
    const { end } = open('move');

    expect(refuseIfExclusiveEditSession('applying invert')).toBe(true);

    end();

    expect(refuseIfExclusiveEditSession('applying invert')).toBe(false);
  });
});
