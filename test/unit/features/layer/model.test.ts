import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it } from 'vitest';
import { changeBaseLayerColor, createLayer, getBaseLayerColor, getBlendModeName } from '~/features/layer/model';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

describe('layer model', () => {
  beforeEach(() => {
    setProjectStore('layers', 'layers', [
      { id: 'l1', name: 'Layer', type: 1 as any, enabled: true, opacity: 1, mode: BlendMode.normal, cutFreeze: false },
      { id: 'l2', name: 'Layer 2', type: 1 as any, enabled: true, opacity: 1, mode: BlendMode.normal, cutFreeze: false },
      { id: 'l3', name: 'Layer 4', type: 1 as any, enabled: true, opacity: 1, mode: BlendMode.normal, cutFreeze: false },
    ]);
  });

  it('getBaseLayerColor returns normalized RGBA for each mode', () => {
    expect(getBaseLayerColor({ colorMode: 'transparent' })).toEqual([0, 0, 0, 0]);
    expect(getBaseLayerColor({ colorMode: 'white' })).toEqual([1, 1, 1, 1]);
    expect(getBaseLayerColor({ colorMode: 'black' })).toEqual([0, 0, 0, 1]);
    expect(getBaseLayerColor({ colorMode: 'custom', customColor: '#336699' })).toEqual([51 / 255, 102 / 255, 153 / 255, 1]);
  });

  it('createLayer assigns next available numbered name when checkUnique is true', () => {
    const created = createLayer(
      {
        name: 'Layer',
        type: 1 as any,
        enabled: true,
        opacity: 1,
        mode: BlendMode.normal,
        cutFreeze: false,
      },
      true
    );

    expect(created.name).toBe('Layer 3');
  });

  it('createLayer keeps original name when checkUnique is false', () => {
    const created = createLayer(
      {
        name: 'Layer',
        type: 1 as any,
        enabled: true,
        opacity: 1,
        mode: BlendMode.normal,
        cutFreeze: false,
      },
      false
    );

    expect(created.name).toBe('Layer');
  });

  it('changeBaseLayerColor returns a copied object with updated mode/color', () => {
    const base = { colorMode: 'black' as const };
    const changed = changeBaseLayerColor(base, 'custom', '#123456');

    expect(changed).toEqual({ colorMode: 'custom', customColor: '#123456' });
    expect(base).toEqual({ colorMode: 'black' });
  });

  it('getBlendModeName resolves known modes', () => {
    expect(getBlendModeName(BlendMode.normal)).toBe('normal');
  });
});
