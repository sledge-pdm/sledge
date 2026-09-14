import { createEffect, createRoot } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { busyStore, currentBusyOperation, isBusy, runExclusive, setBusyProgress } from '~/features/busy';

/** @description a promise plus the handles to settle it from outside. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('features/busy exclusion (e2e)', () => {
  it('is answered from the store, so a component asking can be told when it changes', async () => {
    // isBusy reads busyStore rather than the plain owner variable. a `disabled={isBusy()}` that read a plain
    // variable would be evaluated once and never again.
    const seen: boolean[] = [];
    const dispose = createRoot((disposeRoot) => {
      createEffect(() => seen.push(isBusy()));
      return disposeRoot;
    });

    await Promise.resolve();
    expect(seen).toEqual([false]);

    const gate = deferred();
    const running = runExclusive('save', () => gate.promise);
    await Promise.resolve();
    expect(seen).toEqual([false, true]);

    gate.resolve();
    await running;
    await Promise.resolve();
    expect(seen).toEqual([false, true, false]);

    dispose();
  });

  it('is held from before the caller gets control back', async () => {
    const gate = deferred();
    // not awaited: this is the caller's own tick, the one a second operation would arrive in
    const running = runExclusive('save', () => gate.promise);

    expect(isBusy()).toBe(true);
    expect(currentBusyOperation()).toBe('save');

    gate.resolve();
    await running;
    expect(isBusy()).toBe(false);
  });

  it('turns down a second operation and hands the caller its own answer', async () => {
    const gate = deferred();
    const running = runExclusive('save', () => gate.promise);

    const refused = await runExclusive('imageImport', async () => 'ran', { onRejected: () => 'refused' as const });
    expect(refused).toBe('refused');

    gate.resolve();
    await running;
  });

  it('gives the window back when the operation throws', async () => {
    await expect(
      runExclusive('save', async () => {
        throw new Error('write failed');
      })
    ).rejects.toThrow('write failed');

    expect(isBusy()).toBe(false);
    expect(busyStore.operation).toBeUndefined();
  });

  it('runs an inherited step inside the period rather than taking a new one', async () => {
    const inner = vi.fn(async () => 'inner');

    const result = await runExclusive('snapshotLoad', async () => {
      // this is the backup a snapshot restore takes first: the same operation, not a second one
      const innerResult = await runExclusive('snapshotCreate', inner, { mode: 'inherit' });
      // the window is still the outer operation's throughout - it is never released and retaken
      expect(currentBusyOperation()).toBe('snapshotLoad');
      return innerResult;
    });

    expect(result).toBe('inner');
    expect(inner).toHaveBeenCalledTimes(1);
    expect(isBusy()).toBe(false);
  });

  it('lets an inherited step run even though the window is taken', async () => {
    const gate = deferred();
    const running = runExclusive('quit', () => gate.promise);

    // the same call with the default mode would be refused; this one is part of what is already running
    await expect(runExclusive('save', async () => 'saved', { mode: 'inherit' })).resolves.toBe('saved');

    gate.resolve();
    await running;
  });

  it('reports progress only while an operation holds the window', async () => {
    setBusyProgress({ phase: 'layers', done: 1, total: 4 });
    expect(busyStore.progress).toBeUndefined();

    await runExclusive('save', async (handle) => {
      handle.setProgress({ phase: 'layers', done: 2, total: 4 });
      expect(busyStore.progress).toEqual({ phase: 'layers', done: 2, total: 4 });
    });

    // released along with the window, so the modal never shows the last operation's numbers
    expect(busyStore.progress).toBeUndefined();
  });

  describe('a deferred modal', () => {
    it('leaves the window restricted while the modal stays down', async () => {
      const gate = deferred();
      const running = runExclusive('save', () => gate.promise, { deferDialog: true });

      // this is the stretch behind a native dialog: taken, but nothing covering the window yet
      expect(isBusy()).toBe(true);
      expect(busyStore.operation).toBe('save');
      expect(busyStore.dialogVisible).toBe(false);

      // and it refuses a second operation just the same
      await expect(runExclusive('imageImport', async () => 'ran', { onRejected: () => 'refused' as const })).resolves.toBe('refused');

      gate.resolve();
      await running;
    });

    it('goes up when the body says so, and down with the window', async () => {
      await runExclusive(
        'save',
        async (handle) => {
          expect(busyStore.dialogVisible).toBe(false);
          handle.presentDialog();
          expect(busyStore.dialogVisible).toBe(true);
        },
        { deferDialog: true }
      );

      expect(busyStore.dialogVisible).toBe(false);
    });

    it('is up from the start when nothing asked to defer it', async () => {
      await runExclusive('imageImport', async () => {
        expect(busyStore.dialogVisible).toBe(true);
      });
    });

    it('cannot be hidden by a step running inside someone else’s period', async () => {
      await runExclusive('quit', async () => {
        expect(busyStore.dialogVisible).toBe(true);

        // the save inside a quit asks to defer, but the prompt above it is already covered
        await runExclusive('save', async () => expect(busyStore.dialogVisible).toBe(true), { mode: 'inherit', deferDialog: true });

        expect(busyStore.dialogVisible).toBe(true);
      });
    });
  });

  it('does not take the window at all in skip mode', async () => {
    // the startup load: there is no editor yet for an exclusive period to hold back
    await runExclusive(
      'projectLoad',
      async () => {
        expect(isBusy()).toBe(false);
      },
      { mode: 'skip' }
    );

    expect(isBusy()).toBe(false);
  });
});
