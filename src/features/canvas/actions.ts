import { HistoryContext, Size2D, Vec2 } from '@sledge-pdm/core';
import { registerCommandsHistory } from '~/features/history';
import { CanvasSizeCommand } from '~/features/history/commands';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { setInteractStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { selectionManager } from '../selection/SelectionManager';
import { isValidCanvasSize, resizeBufferWithOrigins, toLayerOrigin } from './service';

export interface ChangeCanvasSizeOptions {
  srcOrigin?: Vec2;
  destOrigin?: Vec2;
  register?: boolean;
}

export function changeCanvasSize(newSize: Size2D, options: ChangeCanvasSizeOptions): boolean {
  const { register = true, srcOrigin: src = { x: 0, y: 0 }, destOrigin: dest = { x: 0, y: 0 } } = options;
  if (!isValidCanvasSize(newSize)) return false;
  const oldSize = { width: projectStore.canvas.size.width, height: projectStore.canvas.size.height };
  if (oldSize.width === newSize.width && oldSize.height === newSize.height && src.x === 0 && src.y === 0 && dest.x === 0 && dest.y === 0)
    return false;

  const layerIds = allLayers().map((l) => l.id);
  const command = new CanvasSizeCommand({
    beforeSize: oldSize,
    afterSize: newSize,
    historyMode: 'layer',
    layerIds,
  });
  if (register) {
    for (const layerId of layerIds) {
      const frascoLayer = layerManager.getLayerOptional(layerId);
      if (frascoLayer) {
        frascoLayer.commitHistory(undefined, { silent: true });
      }
    }
    command.registerBefore();
  }

  setProjectStore('canvas', 'size', newSize);
  for (const l of allLayers()) {
    const frascoLayer = layerManager.getLayerOptional(l.id);
    if (frascoLayer) {
      const srcLayerOrigin = toLayerOrigin(src, oldSize.height);
      const destLayerOrigin = toLayerOrigin(dest, newSize.height);
      frascoLayer.resizePreserve(newSize.width, newSize.height, srcLayerOrigin, destLayerOrigin);
    } else {
      const baseBuffer = layerManager.exportRawCanvas(l.id);
      const resized = resizeBufferWithOrigins(baseBuffer, oldSize, newSize, src, dest);
      layerManager.replaceLayerBuffer(l.id, resized, newSize.width, newSize.height, { inputSpace: 'canvas' });
    }
  }
  updateFrascoCanvas('changeCanvasSize');
  selectionManager.resize(newSize);

  setInteractStore('isCanvasSizeFrameMode', false);
  setInteractStore('canvasSizeFrameOffset', { x: 0, y: 0 });
  setInteractStore('canvasSizeFrameSize', { width: 0, height: 0 });

  selectionManager.clearAll();

  if (register) {
    command.registerAfter();
    const context: HistoryContext = {
      icon:
        newSize.width * newSize.height >= oldSize.width * oldSize.height
          ? '/assets/icons/actions/canvas_size_bigger.png'
          : '/assets/icons/actions/canvas_size_smaller.png',
      description: `${oldSize.width}x${oldSize.height} -> ${newSize.width}x${newSize.height}`,
    };
    registerCommandsHistory(command, { context });
  }

  return true;
}
