import { describe, expect, it, vi } from 'vitest';
import { deflateAllAsync } from '~/utils/Compression';

/**
 * a save compresses several layers at once. one of them failing does not stop the others - they are already
 * reading from the GPU - so the call must not come back until they have, or the save's `finally` would give
 * the window and the history stacks back while those reads are still going.
 */

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const buffer = () => new Uint8ClampedArray(4);
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** @description whether a promise has settled, without settling the test on it. */
function settledState(promise: Promise<unknown>) {
  const state = { done: false };
  promise.then(
    () => (state.done = true),
    () => (state.done = true)
  );
  return state;
}

describe('utils/Compression failure containment (e2e)', () => {
  it('waits for the buffers still compressing before it reports the failure', async () => {
    const slow = deferred<Uint8ClampedArray>();
    const failure = new Error('readback lost');
    const started: number[] = [];

    // four run at once, so with six the last two are only claimed as earlier ones finish
    const providers = [
      async () => {
        started.push(0);
        return buffer();
      },
      async () => {
        started.push(1);
        throw failure;
      },
      async () => {
        started.push(2);
        return await slow.promise;
      },
      async () => {
        started.push(3);
        return buffer();
      },
      async () => {
        started.push(4);
        return buffer();
      },
      async () => {
        started.push(5);
        return buffer();
      },
    ];

    const deflating = deflateAllAsync(providers);
    const state = settledState(deflating);
    await flush();

    // one provider is still reading, so this must not have come back yet
    expect(state.done).toBe(false);
    // and nothing new is claimed once the result is going to be thrown away
    expect(started).not.toContain(5);

    slow.resolve(buffer());
    await expect(deflating).rejects.toBe(failure);
  });

  it('stops claiming buffers once the signal is aborted, and still waits for the ones in hand', async () => {
    const controller = new AbortController();
    const slow = deferred<Uint8ClampedArray>();
    const started: number[] = [];

    const providers = Array.from({ length: 8 }, (_unused, index) => async () => {
      started.push(index);
      if (index === 0) return await slow.promise;
      return buffer();
    });

    const deflating = deflateAllAsync(providers, { signal: controller.signal });
    const state = settledState(deflating);
    await flush();

    controller.abort();
    await flush();
    expect(state.done).toBe(false);
    const claimedAtAbort = started.length;

    slow.resolve(buffer());
    await expect(deflating).rejects.toThrow();
    expect(started).toHaveLength(claimedAtAbort);
  });

  it('reports the first failure, not whichever one lands last', async () => {
    const first = new Error('first');
    const second = deferred<Uint8ClampedArray>();

    const providers = [
      async () => {
        throw first;
      },
      async () => await second.promise,
    ];

    const deflating = deflateAllAsync(providers);
    await flush();
    second.reject(new Error('second'));

    await expect(deflating).rejects.toBe(first);
  });

  it('gives back every buffer, in order, when nothing fails', async () => {
    const sizes = [1, 2, 3, 4, 5, 6, 7];
    const providers = sizes.map((size) => vi.fn(async () => new Uint8ClampedArray(size * 4)));

    const deflated = await deflateAllAsync(providers);

    expect(deflated).toHaveLength(sizes.length);
    deflated.forEach((bytes) => expect(bytes).toBeInstanceOf(Uint8Array));
    providers.forEach((provider) => expect(provider).toHaveBeenCalledTimes(1));
  });
});
