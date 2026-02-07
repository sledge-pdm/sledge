import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApplySelectionFrontToBackCommand } from '~/features/history/command/selection/SelectionChangeCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { deleteSelectedArea } from '~/features/selection/service';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../helpers';

const buildMask = (width: number, height: number, positions: Array<{ x: number; y: number }>) => {
  const mask = new SelectionMask(width, height);
  const data = new Uint8Array(width * height);
  for (const { x, y } of positions) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    data[y * width + x] = 1;
  }
  mask.setMask(data);
  return mask;
};

const getPixel = (buffer: Uint8ClampedArray, width: number, x: number, y: number) => {
  const idx = (y * width + x) * 4;
  return [buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]];
};

describe('SelectionChangeCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();

    const width = 2;
    const height = 2;
    const buffer = new Uint8ClampedArray([10, 0, 0, 255, 0, 10, 0, 255, 0, 0, 10, 255, 10, 10, 10, 255]);

    const base = buildLayer('layer-1');
    resetStore([base], { width, height });
    registerLayers([base], width, height, buffer);
    selectionManager.clearAll();
  });

  afterEach(() => {
    selectionManager.clearAll();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('swaps selection back/front and affects deletion target', () => {
    const width = 2;
    const height = 2;

    const maskA = buildMask(width, height, [{ x: 0, y: 0 }]);
    const maskB = buildMask(width, height, [{ x: 1, y: 0 }]);

    selectionManager.setBack(maskA);
    selectionManager.setFront(maskB);

    const command = new ApplySelectionFrontToBackCommand({ swapBack: selectionManager.getFront() });

    command.forward();
    expect(selectionManager.getFront()).toBeUndefined();

    deleteSelectedArea({ layerId: 'layer-1', noAction: true });
    let buffer = layerManager.exportRawCanvas('layer-1');
    expect(getPixel(buffer, width, 1, 0)).toEqual([0, 0, 0, 0]);
    expect(getPixel(buffer, width, 0, 0)).toEqual([10, 0, 0, 255]);

    const layer = layerManager.getLayer('layer-1');
    layer.undo();

    command.backward();
    expect(selectionManager.getFront()).toBeUndefined();

    deleteSelectedArea({ layerId: 'layer-1', noAction: true });
    buffer = layerManager.exportRawCanvas('layer-1');
    expect(getPixel(buffer, width, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(getPixel(buffer, width, 1, 0)).toEqual([0, 10, 0, 255]);
  });

  it('handles undefined swapBack and empty back selection', () => {
    const width = 2;
    const height = 2;

    const mask = buildMask(width, height, [{ x: 0, y: 0 }]);
    selectionManager.setBack(mask);

    const command = new ApplySelectionFrontToBackCommand({ swapBack: undefined });
    command.forward();
    expect(selectionManager.getBack()).toBeUndefined();
    expect(selectionManager.getFront()).toBeUndefined();

    command.backward();
    expect(selectionManager.getBack()).toBeDefined();

    selectionManager.clearAll();
    const swapBack = buildMask(width, height, [{ x: 1, y: 1 }]);
    const command2 = new ApplySelectionFrontToBackCommand({ swapBack });
    command2.forward();
    expect(selectionManager.getBack()).toBeDefined();
    expect(selectionManager.getFront()).toBeUndefined();

    const context = command2.getContext();
    expect(context.icon).toBe('/assets/icons/actions/layer.png');
    expect(context.description).toBe('selection change');
  });
});
