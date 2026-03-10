import { describe, expect, it } from 'vitest';
import { normalizeLayerSelection } from '~/stores/RuntimeProject';

describe('stores/RuntimeProject', () => {
  it('normalizes array-based layer selection into Set<string>', () => {
    const selected = normalizeLayerSelection(['layer-1', 'layer-2', 100, null, 'layer-1']);

    expect(selected).toBeInstanceOf(Set);
    expect(Array.from(selected)).toEqual(['layer-1', 'layer-2']);
  });

  it('returns empty set for invalid selection payload', () => {
    expect(normalizeLayerSelection(undefined).size).toBe(0);
    expect(normalizeLayerSelection({ selected: ['layer-1'] }).size).toBe(0);
  });
});
