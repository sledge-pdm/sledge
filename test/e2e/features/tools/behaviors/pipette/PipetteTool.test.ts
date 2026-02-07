import { RGBA, RGBAToHex } from '@sledge-pdm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { currentColor } from '~/features/color';
import { PaletteType } from '~/features/color/palette';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { PipetteTool } from '~/features/tools/behaviors/pipette/PipetteTool';
import { colorStore, interactStore, setColorStore, setInteractStore } from '~/stores/EditorStores';
import { buildLayer, resetStore, setupWebGL } from '../../../history/helpers';

const args = (x: number, y: number, event?: PointerEvent): Parameters<PipetteTool['onStart']>[0] =>
  ({
    layerId: 'layer-1',
    rawPosition: { x, y },
    position: { x, y },
    color: [0, 0, 0, 255],
    event,
  }) as Parameters<PipetteTool['onStart']>[0];

describe('PipetteTool (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();

    resetStore([buildLayer('layer-1')], { width: 2, height: 1 });
    historyManager.clearHistory();
    setInteractStore('isPointerOnCanvas', false);
    setColorStore('currentPalette', PaletteType.primary);
    setColorStore('palettes', PaletteType.primary, [1, 2, 3, 255]);
    setColorStore('history', []);
  });

  afterEach(() => {
    historyManager.clearHistory();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('does not pick any color when pointer is outside canvas', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([200, 10, 20, 255, 50, 60, 70, 255]), 2, 1, { inputSpace: 'layer' });
    const tool = new PipetteTool();

    tool.onStart(args(0, 0));
    const result = tool.onEnd(args(0, 0));

    expect(currentColor()).toEqual([1, 2, 3, 255]);
    expect(colorStore.history).toEqual([]);
    expect(historyManager.canUndo()).toBe(false);
    expect(result).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    });
  });

  it('picks layer pixel, updates palette/history, and registers color history command', () => {
    const picked: RGBA = [32, 64, 96, 255];
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([picked[0], picked[1], picked[2], picked[3], 0, 0, 0, 255]), 2, 1, {
      inputSpace: 'layer',
    });
    setInteractStore('isPointerOnCanvas', true);
    const tool = new PipetteTool();

    tool.onStart(args(0, 0));
    const result = tool.onEnd(args(0, 0));

    expect(currentColor()).toEqual(picked);
    expect(colorStore.history[0]).toEqual(picked);
    expect(historyManager.canUndo()).toBe(true);
    const context = historyManager.getUndoStack().at(-1)?.getContext()?.[0];
    expect(context?.description).toContain(`#${RGBAToHex([1, 2, 3, 255])}`);
    expect(context?.description).toContain(`#${RGBAToHex(picked)}`);
    expect(result).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    });
  });

  it('uses latest sampled color from onMove and keeps tool active on shift-end', () => {
    const first: RGBA = [10, 11, 12, 255];
    const second: RGBA = [80, 81, 82, 120];
    layerManager.registerLayer(
      'layer-1',
      new Uint8ClampedArray([first[0], first[1], first[2], first[3], second[0], second[1], second[2], second[3]]),
      2,
      1,
      { inputSpace: 'layer' }
    );
    setInteractStore('isPointerOnCanvas', true);
    const tool = new PipetteTool();

    tool.onStart(args(0, 0));
    tool.onMove(args(1, 0));
    const result = tool.onEnd(args(1, 0, { shiftKey: true } as PointerEvent));

    expect(currentColor()).toEqual(second);
    expect(colorStore.history[0]).toEqual(second);
    expect(result).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: false,
    });
    expect(interactStore.isPointerOnCanvas).toBe(true);
  });

  it('keeps previously sampled color when pointer leaves canvas during move', () => {
    const first: RGBA = [20, 30, 40, 255];
    const second: RGBA = [70, 80, 90, 255];
    layerManager.registerLayer(
      'layer-1',
      new Uint8ClampedArray([first[0], first[1], first[2], first[3], second[0], second[1], second[2], second[3]]),
      2,
      1,
      { inputSpace: 'layer' }
    );
    setInteractStore('isPointerOnCanvas', true);
    const tool = new PipetteTool();

    tool.onStart(args(0, 0));
    setInteractStore('isPointerOnCanvas', false);
    tool.onMove(args(1, 0));
    const result = tool.onEnd(args(1, 0));

    expect(currentColor()).toEqual(first);
    expect(result).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    });
  });

  it('returns to previous tool on cancel without changing current color', () => {
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([200, 100, 50, 255, 0, 0, 0, 255]), 2, 1, { inputSpace: 'layer' });
    setInteractStore('isPointerOnCanvas', true);
    const tool = new PipetteTool();

    tool.onStart(args(0, 0));
    const cancel = tool.onCancel(args(0, 0));

    expect(cancel).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    });
    expect(currentColor()).toEqual([1, 2, 3, 255]);
    expect(colorStore.history).toEqual([]);
  });

  it('does not change color when layer pixel cannot be sampled', () => {
    setInteractStore('isPointerOnCanvas', true);
    const tool = new PipetteTool();
    const missingLayerArgs = { ...args(0, 0), layerId: 'missing-layer' } as Parameters<PipetteTool['onStart']>[0];

    tool.onStart(missingLayerArgs);
    const result = tool.onEnd(missingLayerArgs);

    expect(currentColor()).toEqual([1, 2, 3, 255]);
    expect(colorStore.history).toEqual([]);
    expect(result).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    });
  });
});
