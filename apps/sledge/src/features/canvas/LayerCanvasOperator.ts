import { Vec2 } from '@sledge/core';
import { currentColor, hexToRGBA } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { findLayerById } from '~/features/layer';
import { flushPatch } from '~/features/layer/anvil/AnvilController';
import { DebugLogger, setBottomBarText } from '~/features/log/service';
import { AnvilToolContext, ToolArgs, ToolResult, createAnvilToolContext } from '~/features/tools/behaviors/ToolBehavior';
import { getPrevActiveToolCategoryId, isToolAllowedInCurrentLayer, setActiveToolCategory } from '~/features/tools/ToolController';
import { ToolCategory } from '~/features/tools/Tools';
import { interactStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';

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
    // Anvil コンテキスト生成 (ツールは全てこちらを受け取る)
    const ctx = createAnvilToolContext(layer.id);
    const result = this.useTool(ctx, state, toolCategory, toolArgs);

    if (result) {
      if (result.shouldUpdate) {
        eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: 'LayerCanvasOperator (action: ' + DrawState[state] + ')' });
        eventBus.emit('preview:requestUpdate', { layerId: layer.id });
      }
      if (result.shouldRegisterToHistory) {
        const patch = flushPatch(layer.id);
        if (patch) projectHistoryController.addAction(new AnvilLayerHistoryAction(layer.id, patch, { tool: toolCategory.id }));
      }

      if (result.shouldReturnToPrevTool) {
        const prevTool = getPrevActiveToolCategoryId();
        if (prevTool) setActiveToolCategory(prevTool);
      }
    }
  }

  private useTool(ctx: AnvilToolContext, state: DrawState, tool: ToolCategory, toolArgs: ToolArgs) {
    let toolResult: ToolResult | undefined = undefined;
    const start = new Date().getTime();
    switch (state) {
      case DrawState.start:
        toolResult = tool.behavior.onStart(ctx, toolArgs);
        break;
      case DrawState.move:
        toolResult = tool.behavior.onMove(ctx, toolArgs);
        break;
      case DrawState.end:
        toolResult = tool.behavior.onEnd(ctx, toolArgs);
        break;
      case DrawState.cancel:
        toolResult = tool.behavior.onCancel?.(ctx, toolArgs);
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
