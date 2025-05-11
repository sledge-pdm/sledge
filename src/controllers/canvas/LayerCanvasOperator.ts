import { setBottomBarText } from '~/controllers/log/LogController';
import { getCurrentTool } from '~/controllers/tool/ToolController';
import { layerAgentManager } from '~/routes/editor';
import { Vec2 } from '~/types/Vector';
import { hexToRGBA } from '~/utils/ColorUtils';
import { Tool } from '../../models/tool/Tool';
import { getToolInstance } from '../../models/tool/ToolBase';
import { DrawState } from '../../types/DrawState';
import { currentColor } from '../color/ColorController';
import LayerImageAgent from '../layer/image/LayerImageAgent';
import { findLayerById } from '../layer_list/LayerListController';

export default class LayerCanvasOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  public handleDraw(state: DrawState, position: Vec2, last?: Vec2) {
    const agent = layerAgentManager.getAgent(this.getLayerIdToDraw());
    if (!agent) return;
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return;
    const image = agent.getBuffer();
    if (!image) return;

    position = this.getMagnificatedPosition(position, layer.dotMagnification);
    if (last) last = this.getMagnificatedPosition(last, layer.dotMagnification);

    const result = this.useTool(agent, state, image, getCurrentTool(), position, last);

    if (result) {
      agent.callOnImageChangeListeners();
      agent.getTileManager().resetDirtyStates();
      
      if (state === DrawState.end) {
        agent.registerToHistory();
        agent.getTileManager().resetAllDirtyStates();
      }
    }
  }

  private useTool(agent: LayerImageAgent, state: DrawState, image: Uint8ClampedArray, tool: Tool, position: Vec2, last?: Vec2) {
    const toolInstance = getToolInstance(tool.type);
    const toolArgs = {
      image,
      position,
      lastPosition: last,
      size: tool.size,
      color: hexToRGBA(currentColor()),
    };
    const startTime = Date.now();
    let isDrawnAction;
    switch (state) {
      case DrawState.start:
        const isDrawnActionInStart = toolInstance.onStart(agent, toolArgs);
        const isDrawnActionInMove = toolInstance.onMove(agent, toolArgs);
        isDrawnAction = isDrawnActionInStart || isDrawnActionInMove;
        break;
      case DrawState.move:
        isDrawnAction = toolInstance.onMove(agent, toolArgs);
        break;
      case DrawState.end:
        isDrawnAction = toolInstance.onEnd(agent, toolArgs);
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
