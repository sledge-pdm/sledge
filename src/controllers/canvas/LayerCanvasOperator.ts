import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { findLayerById } from '~/controllers/layer/LayerListController';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { setBottomBarText } from '~/controllers/log/LogController';
import { getCurrentTool } from '~/controllers/tool/ToolController';
import { ToolArgs } from '~/tools/ToolBase';
import { Vec2 } from '~/types/Vector';
import { hexToRGBA } from '~/utils/ColorUtils';
import { eventBus } from '~/utils/EventBus';
import { Tool } from '../../models/tool/Tool';
import { DrawState } from '../../types/DrawState';
import { currentColor } from '../color/ColorController';

export default class LayerCanvasOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  public handleDraw(state: DrawState, originalEvent: PointerEvent, position: Vec2, last?: Vec2) {
    const agent = getAgentOf(this.getLayerIdToDraw());
    if (!agent) return;
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return;
    const image = agent.getBuffer();
    if (!image) return;

    position = this.getMagnificatedPosition(position, layer.dotMagnification);
    if (last) last = this.getMagnificatedPosition(last, layer.dotMagnification);

    const result = this.useTool(agent, state, originalEvent, image, getCurrentTool(), position, last);

    if (result) {
      // agent.callOnImageChangeListeners({ updatePreview: state === DrawState.end });
      eventBus.emit('webgl:requestUpdate', { onlyDirty: true });
      if (state === DrawState.end) {
        eventBus.emit('preview:requestUpdate', { layerId: layer.id });
        agent.registerToHistory();
      }
    }
  }

  private useTool(
    agent: LayerImageAgent,
    state: DrawState,
    originalEvent: PointerEvent,
    image: Uint8ClampedArray,
    tool: Tool,
    position: Vec2,
    last?: Vec2
  ) {
    const toolArgs: ToolArgs = {
      position,
      lastPosition: last,
      size: tool.size,
      color: hexToRGBA(currentColor()),
      event: originalEvent,
    };
    const startTime = Date.now();
    let isDrawnAction;
    switch (state) {
      case DrawState.start:
        isDrawnAction = tool.behavior.onStart(agent, toolArgs);
        // const isDrawnActionInStart = tool.behavior.onStart(agent, toolArgs);
        // const isDrawnActionInMove = tool.behavior.onMove(agent, toolArgs);
        // isDrawnAction = isDrawnActionInStart || isDrawnActionInMove;
        break;
      case DrawState.move:
        isDrawnAction = tool.behavior.onMove(agent, toolArgs);
        break;
      case DrawState.end:
        isDrawnAction = tool.behavior.onEnd(agent, toolArgs);
        break;
    }
    const endTime = Date.now();
    if (isDrawnAction) {
      setBottomBarText(`${tool.type} finished. ${endTime - startTime} ms. (updated ${agent?.getTileManager().getDirtyTiles().length} dirty tiles)`);
    }
    return image;
  }

  private getMagnificatedPosition(position: Vec2, dotMagnification: number) {
    return {
      x: Math.floor(position.x / dotMagnification),
      y: Math.floor(position.y / dotMagnification),
    };
  }
}
