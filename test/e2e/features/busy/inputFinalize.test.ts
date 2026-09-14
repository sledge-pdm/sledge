import { afterEach, describe, expect, it, vi } from 'vitest';
import { finalizePendingInput, registerInputFinalizer } from '~/features/busy';

describe('features/busy input finalization (e2e)', () => {
  const unregisters: (() => void)[] = [];
  const register = (finalizer: () => void) => {
    const unregister = registerInputFinalizer(finalizer);
    unregisters.push(unregister);
    return unregister;
  };

  afterEach(() => {
    unregisters.splice(0).forEach((unregister) => unregister());
    document.body.innerHTML = '';
  });

  it('settles every registered finalizer', () => {
    const stroke = vi.fn();
    const transform = vi.fn();
    register(stroke);
    register(transform);

    finalizePendingInput();

    expect(stroke).toHaveBeenCalledTimes(1);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  it('runs the rest even when one of them fails', () => {
    const after = vi.fn();
    register(() => {
      throw new Error('could not end the stroke');
    });
    register(after);

    expect(() => finalizePendingInput()).not.toThrow();
    // a gesture that cannot be settled must not leave the opacity entry unregistered as well
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('lets a finalizer unregister itself as it settles', () => {
    const once = vi.fn();
    let unregister: () => void;
    unregister = register(() => {
      once();
      unregister();
    });

    finalizePendingInput();
    finalizePendingInput();

    expect(once).toHaveBeenCalledTimes(1);
  });

  it('commits a focused field before anything reads the project', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    const order: string[] = [];
    input.addEventListener('blur', () => order.push('blur'));
    register(() => order.push('finalizer'));

    finalizePendingInput();

    // blur first: the value a field commits on blur can be what a finalizer then has to register
    expect(order).toEqual(['blur', 'finalizer']);
    expect(document.activeElement).not.toBe(input);
  });

  it('stops calling a finalizer once it is unregistered', () => {
    const gone = vi.fn();
    const unregister = register(gone);
    unregister();

    finalizePendingInput();

    expect(gone).not.toHaveBeenCalled();
  });
});
