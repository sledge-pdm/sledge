import { BlendMode } from '@sledge-pdm/frasco';
import { describe, expect, it } from 'vitest';
import { LayerType } from '~/features/layer/types';

describe('layer types', () => {
  it('keeps BlendMode labels stable', () => {
    expect(BlendMode.normal).toBe('Normal');
    expect(BlendMode.softLight).toBe('Soft Light');
  });

  it('keeps LayerType order stable', () => {
    expect(LayerType.Base).toBe(0);
  });
});
