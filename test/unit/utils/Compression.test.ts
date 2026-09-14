import { gzipInflate } from '@sledge-pdm/core';
import { describe, expect, it } from 'vitest';
import { deflateAllAsync } from '~/utils/Compression';

// the deflate itself is core's gzipDeflateAsync and is covered by core's own tests.
// what belongs here is the orchestration deflateAllAsync adds on top: ordering and lazy buffer access.

const makeBuffer = (length: number, seed: number) => {
  const buffer = new Uint8ClampedArray(length);
  for (let i = 0; i < length; i++) buffer[i] = (i * seed) % 251;
  return buffer;
};

describe('utils/Compression', () => {
  it('keeps input order when deflating many buffers', async () => {
    const sources = Array.from({ length: 9 }, (_v, i) => makeBuffer(512 + i * 64, i + 1));
    const deflated = await deflateAllAsync(sources.map((s) => () => s));

    expect(deflated.length).toBe(sources.length);
    deflated.forEach((d, i) => {
      expect(Array.from(gzipInflate(d))).toEqual(Array.from(sources[i]));
    });
  });

  it('requests each buffer only when it is about to be compressed', async () => {
    const sources = Array.from({ length: 12 }, (_v, i) => makeBuffer(256, i + 1));
    let live = 0;
    let maxLive = 0;

    const deflated = await deflateAllAsync(
      sources.map((s) => () => {
        live++;
        maxLive = Math.max(maxLive, live);
        queueMicrotask(() => live--);
        return s;
      })
    );

    expect(deflated.length).toBe(sources.length);
    // bounded by the concurrency limit, not by the number of buffers
    expect(maxLive).toBeLessThan(sources.length);
  });

  it('returns an empty result for no input', async () => {
    expect(await deflateAllAsync([])).toEqual([]);
  });
});
