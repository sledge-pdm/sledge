import { Vec2 } from '@sledge/core';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { findLayerById } from '~/controllers/layer/LayerListController';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { setBottomBarText } from '~/controllers/log/LogController';
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
}

export default class LayerCanvasOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  public handleDraw(state: DrawState, originalEvent: PointerEvent, toolCategory: ToolCategory, position: Vec2, last?: Vec2) {
    const agent = getAgentOf(this.getLayerIdToDraw());
    if (!agent) return;
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return;

    position = this.getMagnificatedPosition(position, layer.dotMagnification);
    if (last) last = this.getMagnificatedPosition(last, layer.dotMagnification);

    if (toolCategory.behavior.onlyOnCanvas && !interactStore.isMouseOnCanvas) return;

    const result = this.useTool(agent, state, originalEvent, toolCategory, position, last);

    if (result) {
      if (result.shouldUpdate) {
        eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: 'LayerCanvasOperator (action: ' + DrawState[state] + ')' });
        eventBus.emit('preview:requestUpdate', { layerId: layer.id });
      }
      if (result.shouldRegisterToHistory) {
        agent.registerToHistory();
      }
    }
  }

  private useTool(agent: LayerImageAgent, state: DrawState, originalEvent: PointerEvent, tool: ToolCategory, position: Vec2, last?: Vec2) {
    const toolArgs: ToolArgs = {
      position,
      lastPosition: last,
      presetName: tool.presets?.selected,
      color: hexToRGBA(currentColor()),
      event: originalEvent,
    };
    const startTime = Date.now();
    let update: ToolResult | undefined = undefined;
    switch (state) {
      case DrawState.start:
        update = tool.behavior.onStart(agent, toolArgs);
        break;
      case DrawState.move:
        update = tool.behavior.onMove(agent, toolArgs);
        break;
      case DrawState.end:
        update = tool.behavior.onEnd(agent, toolArgs);
        break;
    }
    const endTime = Date.now();
    if (update) {
      setBottomBarText(`${tool.name} finished. ${endTime - startTime} ms. (updated ${agent?.getTileManager().getDirtyTiles().length} dirty tiles)`);
    }
    return update;
  }

  private getMagnificatedPosition(position: Vec2, dotMagnification: number) {
    return {
      x: Math.floor(position.x / dotMagnification),
      y: Math.floor(position.y / dotMagnification),
    };
  }
}
