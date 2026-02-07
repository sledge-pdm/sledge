import { beforeEach, describe, expect, it } from 'vitest';
import { LayerReorderCommand } from '~/features/history/command/layer/LayerReorderCommand';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from '../../helpers';

describe('LayerReorderCommand (e2e)', () => {
  beforeEach(() => {
    resetStore([buildLayer('base')]);
  });

  it('applies and reverts order', () => {
    const layers = [buildLayer('a'), buildLayer('b'), buildLayer('c')];
    resetStore(layers);

    const command = new LayerReorderCommand({
      beforeOrder: ['a', 'b', 'c'],
      afterOrder: ['b', 'c', 'a'],
    });

    command.forward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['b', 'c', 'a']);

    command.backward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });
});
