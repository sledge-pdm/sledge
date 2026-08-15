import { describe, expect, it } from 'vitest';
import { LayerBufferCache } from '~/features/layer/frasco/LayerBufferCache';

const bytes = (...values: number[]) => new Uint8Array(values);

describe('features/layer/LayerBufferCache', () => {
  it('has nothing for a layer it has never seen', () => {
    const cache = new LayerBufferCache();

    expect(cache.get('a')).toBeUndefined();
  });

  it('hands back what a completed capture committed', () => {
    const cache = new LayerBufferCache();
    const token = cache.beginCapture('a');
    cache.commit('a', token, bytes(1, 2, 3));

    expect(Array.from(cache.get('a')!)).toEqual([1, 2, 3]);
  });

  it('drops the entry when the layer changes', () => {
    const cache = new LayerBufferCache();
    const token = cache.beginCapture('a');
    cache.commit('a', token, bytes(1, 2, 3));

    cache.invalidate('a');

    expect(cache.get('a')).toBeUndefined();
  });

  it('discards a capture that was overtaken by an edit', () => {
    const cache = new LayerBufferCache();
    const token = cache.beginCapture('a');
    // the layer is drawn on while the compression is still running
    cache.invalidate('a');
    cache.commit('a', token, bytes(1, 2, 3));

    // committing stale bytes here would mean the next save writes pre-edit pixels
    expect(cache.get('a')).toBeUndefined();
  });

  it('lets the capture that followed the edit win', () => {
    const cache = new LayerBufferCache();
    const stale = cache.beginCapture('a');
    cache.invalidate('a');
    const fresh = cache.beginCapture('a');

    cache.commit('a', stale, bytes(1, 1, 1));
    cache.commit('a', fresh, bytes(9, 9, 9));

    expect(Array.from(cache.get('a')!)).toEqual([9, 9, 9]);
  });

  it('keeps layers independent', () => {
    const cache = new LayerBufferCache();
    cache.commit('a', cache.beginCapture('a'), bytes(1));
    cache.commit('b', cache.beginCapture('b'), bytes(2));

    cache.invalidate('a');

    expect(cache.get('a')).toBeUndefined();
    expect(Array.from(cache.get('b')!)).toEqual([2]);
  });

  it('drops everything on clear', () => {
    const cache = new LayerBufferCache();
    cache.commit('a', cache.beginCapture('a'), bytes(1));
    cache.commit('b', cache.beginCapture('b'), bytes(2));

    cache.clear();

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('discards a capture that was in flight when the project was replaced', () => {
    const cache = new LayerBufferCache();
    const token = cache.beginCapture('a');

    // a project load disposes every layer; a compression started before it must not repopulate the cache
    cache.clear();
    cache.commit('a', token, bytes(1, 2, 3));

    expect(cache.get('a')).toBeUndefined();
  });
});
