import { Vec2 } from '@sledge/core';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { findLayerById } from '~/controllers/layer/LayerListController';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { setBottomBarText } from '~/controllers/log/LogController';
import { getPrevActiveToolCategory, setActiveToolCategory } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { ToolArgs, ToolResult } from '~/tools/ToolBehavior';
import { ToolCategory } from '~/tools/Tools';
import { hexToRGBA } from '~/utils/ColorUtils';
import { eventBus } from '~/utils/EventBus';
import { currentColor } from '../color/ColorController';

export enum DrawState {
  start,
  move,
  end,
  cancel,
}

export default class LayerCanvasOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  private getMagnificatedPosition(position: Vec2, dotMagnification: number) {
    return {
      x: Math.floor(position.x / dotMagnification),
      y: Math.floor(position.y / dotMagnification),
    };
  }

  public handleDraw(state: DrawState, originalEvent: PointerEvent, toolCategory: ToolCategory, position: Vec2, lastPosition?: Vec2) {
    const agent = getAgentOf(this.getLayerIdToDraw());
    if (!agent) return;
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return;

    const rawPosition = position;
    const rawLastPosition = lastPosition;

    position = this.getMagnificatedPosition(position, layer.dotMagnification);
    if (lastPosition) lastPosition = this.getMagnificatedPosition(lastPosition, layer.dotMagnification);

    if (toolCategory.behavior.onlyOnCanvas && !interactStore.isMouseOnCanvas) return;

    const toolArgs: ToolArgs = {
      rawPosition,
      rawLastPosition,
      position,
      lastPosition,
      presetName: toolCategory.presets?.selected,
      color: hexToRGBA(currentColor()),
      event: originalEvent,
    };
    const result = this.useTool(agent, state, toolCategory, toolArgs);

    if (result) {
      if (result.shouldUpdate) {
        eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: 'LayerCanvasOperator (action: ' + DrawState[state] + ')' });
        eventBus.emit('preview:requestUpdate', { layerId: layer.id });
      }
      if (result.shouldRegisterToHistory) {
        agent.registerToHistory();
      }

      if (result.shouldReturnToPrevTool) {
        const prevTool = getPrevActiveToolCategory();
        if (prevTool) setActiveToolCategory(prevTool);
      }
    }
  }

  private useTool(agent: LayerImageAgent, state: DrawState, tool: ToolCategory, toolArgs: ToolArgs) {
    let toolResult: ToolResult | undefined = undefined;
    switch (state) {
      case DrawState.start:
        toolResult = tool.behavior.onStart(agent, toolArgs);
        break;
      case DrawState.move:
        toolResult = tool.behavior.onMove(agent, toolArgs);
        break;
      case DrawState.end:
        toolResult = tool.behavior.onEnd(agent, toolArgs);
        break;
      case DrawState.cancel:
        toolResult = tool.behavior.onCancel?.(agent, toolArgs);
        break;
    }
    if (toolResult?.result) {
      setBottomBarText(toolResult.result);
    }
    return toolResult;
  }
}
