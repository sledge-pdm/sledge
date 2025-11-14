import { Vec2 } from '@sledge/core';
import { currentColor, hexToRGBA } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { findLayerById } from '~/features/layer';
import { flushPatch } from '~/features/layer/anvil/AnvilController';
import { DebugLogger } from '~/features/log/DebugLogger';
import { setBottomBarText } from '~/features/log/service';
import { ToolArgs, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPrevActiveToolCategoryId, isToolAllowedInCurrentLayer, setActiveToolCategory } from '~/features/tools/ToolController';
import { ToolCategory } from '~/features/tools/Tools';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export enum DrawState {
  start,
  move,
  end,
  cancel,
}

const LOG_LABEL = 'LayerCanvasOperator';
const logger = new DebugLogger(LOG_LABEL, false);

export default class LayerCanvasOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  private getMagnificatedPosition(position: Vec2, dotMagnification: number) {
    return {
      x: Math.floor(position.x / dotMagnification),
      y: Math.floor(position.y / dotMagnification),
    };
  }

  public handleDraw(state: DrawState, originalEvent: PointerEvent, toolCategory: ToolCategory, position: Vec2, lastPosition?: Vec2) {
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return;

    const rawPosition = position;
    const rawLastPosition = lastPosition;

    position = this.getMagnificatedPosition(position, layer.dotMagnification);
    if (lastPosition) lastPosition = this.getMagnificatedPosition(lastPosition, layer.dotMagnification);

    if (toolCategory.behavior.onlyOnCanvas && !interactStore.isMouseOnCanvas) return;
    if (!toolCategory.behavior.allowRightClick && originalEvent.buttons === 2) return;

    // This won't suppress all draw actions on inactive layers.
    // It's due to prevent showing warn in every click out of canvas.
    if (!isToolAllowedInCurrentLayer(toolCategory) && interactStore.isMouseOnCanvas) {
      console.warn('Layer is inactive.');
      setBottomBarText('Layer is inactive.', {
        kind: 'error',
        duration: 1000,
      });
      return;
    }

    // This will suppress all draw actions on inactive layers.
    if (!isToolAllowedInCurrentLayer(toolCategory)) {
      return;
    }

    const toolArgs: ToolArgs = {
      layerId: layer.id,
      rawPosition,
      rawLastPosition,
      position,
      lastPosition,
      presetName: toolCategory.presets?.selected,
      color: hexToRGBA(currentColor()),
      event: originalEvent,
    };
    const result = this.useTool(state, toolCategory, toolArgs);

    if (result) {
      // store placement position when start or end state.
      if (state === DrawState.start || state === DrawState.end) {
        // TODO: consider boundary check (though image offset works properly with negative positions.)
        setInteractStore('placementPosition', position);
      }

      if (result.shouldUpdate) {
        updateWebGLCanvas(true, 'LayerCanvasOperator (action: ' + DrawState[state] + ')');
        updateLayerPreview(layer.id);
      }
      if (result.shouldRegisterToHistory) {
        const patch = flushPatch(layer.id);
        if (patch)
          projectHistoryController.addAction(
            new AnvilLayerHistoryAction({
              layerId: layer.id,
              patch,
              context: { tool: toolCategory.id },
            })
          );
      }

      if (result.shouldReturnToPrevTool) {
        const prevTool = getPrevActiveToolCategoryId();
        if (prevTool) setActiveToolCategory(prevTool);
      }
    }
  }

  private useTool(state: DrawState, tool: ToolCategory, toolArgs: ToolArgs) {
    let toolResult: ToolResult | undefined = undefined;
    const start = new Date().getTime();
    switch (state) {
      case DrawState.start:
        toolResult = tool.behavior.onStart(toolArgs);
        break;
      case DrawState.move:
        toolResult = tool.behavior.onMove(toolArgs);
        break;
      case DrawState.end:
        toolResult = tool.behavior.onEnd(toolArgs);
        break;
      case DrawState.cancel:
        toolResult = tool.behavior.onCancel?.(toolArgs);
        break;
    }
    const end = new Date().getTime();
    logger.debugLog(`${tool.name} ${DrawState[state]} executed in ${end - start} ms: ${toolResult}`);
    if (toolResult?.result) {
      setBottomBarText(toolResult.result, {
        duration: 1500,
      });
    }
    return toolResult;
  }
}
