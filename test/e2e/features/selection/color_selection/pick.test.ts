import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { currentColor } from '~/features/color';
import { PaletteType } from '~/features/color/palette';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import {
  colorSelectionStore,
  getColorSelectionTargetColor,
  isColorSelectionPicking,
  openColorSelectionDialog,
  resetColorSelectionState,
  startColorSelectionPick,
} from '~/features/selection/color_selection';
import { PipetteTool } from '~/features/tools/behaviors/pipette/PipetteTool';
import { colorStore, setColorStore, setInteractStore, setToolStore } from '~/stores/EditorStores';
import { buildLayer, resetStore } from '../../history/helpers';

const args = (x: number, y: number, event?: PointerEvent): Parameters<PipetteTool['onStart']>[0] =>
  ({
    layerId: 'layer-1',
    rawPosition: { x, y },
    position: { x, y },
    color: [0, 0, 0, 255],
    event,
  }) as Parameters<PipetteTool['onStart']>[0];

describe('color selection pick flow (e2e)', () => {
  beforeEach(() => {
    resetColorSelectionState();
    resetStore([buildLayer('layer-1')], { width: 1, height: 1 });
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([32, 64, 96, 255]), 1, 1, { inputSpace: 'layer' });

    setToolStore('activeToolCategory', 'pen');
    setToolStore('prevActiveCategory', undefined);
    setColorStore('currentPalette', PaletteType.primary);
    setColorStore('palettes', PaletteType.primary, [1, 2, 3, 255]);
    setColorStore('history', []);
    setInteractStore('isPointerOnCanvas', true);
  });

  afterEach(() => {
    resetColorSelectionState();
  });

  it('keeps dialog open and updates target color without mutating current color history', () => {
    openColorSelectionDialog();

    expect(colorSelectionStore.isOpen).toBe(true);
    expect(startColorSelectionPick()).toBe(true);
    expect(isColorSelectionPicking()).toBe(true);

    const tool = new PipetteTool();
    tool.onStart(args(0, 0));
    const result = tool.onEnd(args(0, 0));

    expect(result).toEqual({
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    });
    expect(colorSelectionStore.isOpen).toBe(true);
    expect(isColorSelectionPicking()).toBe(false);
    expect(getColorSelectionTargetColor()).toEqual([32, 64, 96, 255]);
    expect(currentColor()).toEqual([1, 2, 3, 255]);
    expect(colorStore.history).toEqual([]);
  });
});
