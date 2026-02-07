import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLayerOptional: vi.fn(),
  updateFrascoCanvas: vi.fn(),
}));

vi.mock('~/features/layer/frasco/LayerManager', () => ({
  layerManager: {
    getLayerOptional: mocks.getLayerOptional,
  },
}));

vi.mock('~/webgl/service', () => ({
  updateFrascoCanvas: mocks.updateFrascoCanvas,
}));

import { applyEffect } from '~/features/effect/Effects';

describe('features/effect/Effects', () => {
  beforeEach(() => {
    mocks.getLayerOptional.mockReset();
    mocks.updateFrascoCanvas.mockReset();
  });

  it('returns immediately when layer id is undefined', () => {
    const mutator = vi.fn();

    applyEffect(undefined, 'invert', mutator);

    expect(mocks.getLayerOptional).not.toHaveBeenCalled();
    expect(mutator).not.toHaveBeenCalled();
    expect(mocks.updateFrascoCanvas).not.toHaveBeenCalled();
  });

  it('returns when target layer is missing', () => {
    const mutator = vi.fn();
    mocks.getLayerOptional.mockReturnValue(undefined);

    applyEffect('layer-1', 'invert', mutator);

    expect(mocks.getLayerOptional).toHaveBeenCalledWith('layer-1');
    expect(mutator).not.toHaveBeenCalled();
    expect(mocks.updateFrascoCanvas).not.toHaveBeenCalled();
  });

  it('applies mutator and requests canvas update when layer exists', () => {
    const layer = { id: 'layer-1' } as any;
    const mutator = vi.fn();
    mocks.getLayerOptional.mockReturnValue(layer);

    applyEffect('layer-1', 'invert', mutator);

    expect(mutator).toHaveBeenCalledTimes(1);
    expect(mutator).toHaveBeenCalledWith(layer);
    expect(mocks.updateFrascoCanvas).toHaveBeenCalledWith('Apply FX for layer-1');
  });
});
