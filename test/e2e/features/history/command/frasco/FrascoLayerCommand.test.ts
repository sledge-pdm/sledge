import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrascoLayerCommand } from '~/features/history/command/frasco/FrascoLayerCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { updateFrascoCanvas } from '~/webgl/service';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../helpers';

vi.mock('~/webgl/service', () => ({
  updateFrascoCanvas: vi.fn(),
}));

describe('FrascoLayerCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();

    const width = 1;
    const height = 1;
    const buffer = new Uint8ClampedArray([10, 20, 30, 255]);

    const base = buildLayer('layer-1');
    resetStore([base], { width, height });
    registerLayers([base], width, height, buffer);
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('undoes and redoes layer history and reflects in rendered pixels', () => {
    const layer = layerManager.getLayer('layer-1');
    layer.commitHistory();

    const updated = new Uint8ClampedArray([200, 100, 50, 255]);
    layer.writePixels(updated, { bounds: { x: 0, y: 0, width: 1, height: 1 } });

    const command = new FrascoLayerCommand({ layerId: 'layer-1', context: { tool: 'brush' } });

    command.backward();
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([10, 20, 30, 255]);

    command.forward();
    expect(layerManager.readPixelCanvas('layer-1', 0, 0)).toEqual([200, 100, 50, 255]);
  });

  it('builds context icons and descriptions with fallbacks', () => {
    const categoryCommand = new FrascoLayerCommand({ layerId: 'missing', context: { tool: 'pen' } });
    const categoryContext = categoryCommand.getContext();
    expect(categoryContext.icon).toBe('/assets/icons/tools/pen.png');
    expect(categoryContext.description).toContain('unknown / pen');

    const unknownCommand = new FrascoLayerCommand({ layerId: 'missing', context: { tool: 'unknown-tool' } });
    const unknownContext = unknownCommand.getContext();
    expect(unknownContext.icon).toBe('/assets/icons/actions/unknown.png');
  });

  it('calls updateFrascoCanvas twice on forward and once on backward', () => {
    const updateSpy = vi.mocked(updateFrascoCanvas);
    updateSpy.mockClear();

    const command = new FrascoLayerCommand({ layerId: 'layer-1', context: { tool: 'pen' } });
    command.forward();
    expect(updateSpy).toHaveBeenCalledTimes(2);

    command.backward();
    expect(updateSpy).toHaveBeenCalledTimes(3);
  });
});
