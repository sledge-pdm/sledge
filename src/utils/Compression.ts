import { gzipDeflateAsync, RawPixelData } from '@sledge-pdm/core';

/**
 * @description how many buffers are compressed at once.
 *   CompressionStream itself runs off the main thread, but every in-flight stream holds its output chunks in
 *   memory, and a project can hand us hundreds of history snapshots at once.
 */
const DEFLATE_CONCURRENCY = 4;

export type DeflateBufferProvider = () => RawPixelData | Promise<RawPixelData>;

export type DeflateAllOptions = {
  /** @description checked between buffers; aborting rejects with the signal's reason. */
  signal?: AbortSignal;
  /** @description called as each buffer finishes, for progress reporting. */
  onEach?: (completed: number, total: number) => void;
};

/**
 * @description deflate many buffers with gzipDeflateAsync, keeping only DEFLATE_CONCURRENCY streams in flight.
 *   buffers are requested one at a time rather than passed in as an array, so callers that read pixels back
 *   from the GPU never hold every raw layer at once. results keep the order of the providers.
 */
export async function deflateAllAsync(providers: readonly DeflateBufferProvider[], options?: DeflateAllOptions): Promise<Uint8Array[]> {
  if (providers.length === 0) return [];

  const deflated = new Array<Uint8Array>(providers.length);
  let nextIndex = 0;
  let completed = 0;

  const runner = async () => {
    for (;;) {
      options?.signal?.throwIfAborted();
      const index = nextIndex++;
      if (index >= providers.length) return;
      deflated[index] = await gzipDeflateAsync(await providers[index]());
      completed++;
      options?.onEach?.(completed, providers.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(DEFLATE_CONCURRENCY, providers.length) }, runner));
  return deflated;
}
