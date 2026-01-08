import { Vec2 } from '@sledge-pdm/core';
import { VERBOSE_LOG_ENABLED } from '~/Consts';
import { currentColor } from '~/features/color';
import { findLayerById } from '~/features/layer';
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

  getRoundedPosition(position: Vec2): Vec2 {
    return {
      x: Math.floor(position.x),
      y: Math.floor(position.y),
    };
  }

  public handleDraw(state: DrawState, originalEvent: PointerEvent, toolCategory: ToolCategory, position: Vec2): boolean {
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return false;

    const rawPosition = position;
    position = this.getRoundedPosition(position);

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
