import { setBottomBarText } from '~/controllers/log/LogController';
import { currentTool } from '~/controllers/tool/ToolController';
import { Vec2 } from '~/types/Vector';
import { hexToRGBA } from '~/utils/ColorUtils';
import LayerImageAgent from '../../models/layer_image/LayerImageAgent';
import TileLayerImageAgent from '../../models/layer_image/agents/TileLayerImageAgent';
import { getToolInstance } from '../../models/tool/ToolBase';
import { DrawState } from '../../types/DrawState';
import { Tool } from '../../types/Tool';
import { currentColor } from '../color/ColorController';
import { findLayerById } from '../layer_list/LayerListController';
import { layerAgentManager } from '~/routes/editor';

export default class LayerCanvasOperator {
  constructor(private readonly getLayerIdToDraw: () => string) {}

  public handleDraw(state: DrawState, position: Vec2, last?: Vec2) {
    const agent = layerAgentManager.getAgent(this.getLayerIdToDraw());
    if (!agent) return;
    const layer = findLayerById(this.getLayerIdToDraw());
    if (!layer) return;
    const image = agent.getImage();
    if (!image) return;

    position = this.getMagnificatedPosition(position, layer.dotMagnification);
    if (last) last = this.getMagnificatedPosition(last, layer.dotMagnification);

    const result = this.useTool(agent, state, image, currentTool(), position, last);

    if (result) {
      agent.setDrawingBuffer(result);
      if (state === DrawState.end) {
        agent.registerDiffAction();
        agent.setImage(result);

        if (agent instanceof TileLayerImageAgent) {
          (agent as TileLayerImageAgent).resetAllDirtyStates();
        }
      }
    }
  }

  private useTool(agent: LayerImageAgent, state: DrawState, image: ImageData, tool: Tool, position: Vec2, last?: Vec2) {
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
      if (agent instanceof TileLayerImageAgent) {
        setBottomBarText(
          `${tool.type} finished. ${endTime - startTime} ms. (updated ${(agent as TileLayerImageAgent).getDirtyTiles().length} dirty tiles)`
        );
      } else {
        setBottomBarText(`${tool.type} finished. ${endTime - startTime} ms.`);
      }
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
