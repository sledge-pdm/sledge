import { Vec2 } from '@sledge/core';
import { VERBOSE_LOG_ENABLED } from '~/Consts';
import { currentColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { findLayerById } from '~/features/layer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { logSystemInfo, logUserError } from '~/features/log/service';
import { ToolArgs, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPrevActiveToolCategoryId, isToolAllowedInCurrentLayer, setActiveToolCategory } from '~/features/tools/ToolController';
import { ToolCategory } from '~/features/tools/Tools';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export enum DrawState {
  start,
  move,
  rawmove,
  end,
  cancel,
}

const LOG_LABEL = 'CanvasToolOperator';
const logDebug = (message: string, ...details: unknown[]) =>
  logSystemInfo(message, { label: LOG_LABEL, details: details.length ? details : undefined, debugOnly: true });

export default class CanvasToolOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  private getMagnificatedPosition(position: Vec2, dotMagnification: number) {
    return {
      x: Math.floor(position.x / dotMagnification),
      y: Math.floor(position.y / dotMagnification),
    };
  }

  public handleDraw(state: DrawState, originalEvent: PointerEvent, toolCategory: ToolCategory, position: Vec2): boolean {
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return false;

    const rawPosition = position;
    position = this.getMagnificatedPosition(position, layer.dotMagnification);

    if (!toolCategory.behavior.allowRightClick && originalEvent.buttons === 2) return false;

    // This won't suppress all draw actions on inactive layers.
    // It's due to prevent showing warn in every click out of canvas.
    if (!isToolAllowedInCurrentLayer(toolCategory) && interactStore.isPointerOnCanvas) {
      logUserError('Layer is inactive.', {
        label: LOG_LABEL,
        duration: 1000,
      });
      return false;
    }

    // This will suppress all draw actions on inactive layers.
    if (!isToolAllowedInCurrentLayer(toolCategory)) {
      return false;
    }

    const toolArgs: ToolArgs = {
      layerId: layer.id,
      rawPosition,
      position,
      presetName: toolCategory.presets?.selected,
      color: currentColor(),
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
        updateWebGLCanvas(true, 'CanvasToolOperator (action: ' + DrawState[state] + ')');
        updateLayerPreview(layer.id);
      }
      if (result.shouldRegisterToHistory) {
        const anvil = getAnvil(layer.id);
        const patch = anvil.flushDiffs();
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
    return !!result;
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
      case DrawState.rawmove:
        toolResult = tool.behavior.onRawMove?.(toolArgs);
        break;
      case DrawState.end:
        toolResult = tool.behavior.onEnd(toolArgs);
        break;
      case DrawState.cancel:
        toolResult = tool.behavior.onCancel?.(toolArgs);
        break;
    }
    const end = new Date().getTime();
    if (VERBOSE_LOG_ENABLED) logDebug(`${tool.name} ${DrawState[state]} executed in ${end - start} ms: ${toolResult}`);
    return toolResult;
  }
}
