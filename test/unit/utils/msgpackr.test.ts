import { describe, expect, it } from 'vitest';
import { packr } from '~/utils/msgpackr';

describe('utils/msgpackr', () => {
  it('preserves Set values after pack/unpack', () => {
    const packed = packr.pack({ selected: new Set(['layer-1']) });
    const unpacked = packr.unpack(packed) as { selected: Set<string> };

    expect(unpacked.selected).toBeInstanceOf(Set);
    expect(unpacked.selected.has('layer-1')).toBe(true);
  });
});
