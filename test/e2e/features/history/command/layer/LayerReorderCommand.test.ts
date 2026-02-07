import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerReorderCommand } from '~/features/history/command/layer/LayerReorderCommand';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { buildLayer, resetStore } from '../../helpers';

vi.mock('~/webgl/service', () => ({
  updateFrascoCanvas: vi.fn(),
}));

describe('LayerReorderCommand (e2e)', () => {
  beforeEach(() => {
    resetStore([buildLayer('base')]);
  });

  it('applies and reverts order', () => {
    const layers = [buildLayer('a'), buildLayer('b'), buildLayer('c')];
    resetStore(layers);

    const updateSpy = vi.mocked(updateFrascoCanvas);
    updateSpy.mockClear();
    const command = new LayerReorderCommand({
      beforeOrder: ['a', 'b', 'c'],
      afterOrder: ['b', 'c', 'a'],
    });

    command.forward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['b', 'c', 'a']);
    expect(updateSpy).toHaveBeenCalledWith('Layer order changed');

    command.backward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['a', 'b', 'c']);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps missing ids at tail', () => {
    const layers = [buildLayer('a'), buildLayer('b'), buildLayer('c')];
    resetStore(layers);

    const command = new LayerReorderCommand({
      beforeOrder: ['a', 'b', 'c'],
      afterOrder: ['b'],
    });

    command.forward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['b', 'a', 'c']);
  });
});
