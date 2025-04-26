import { reconcile } from 'solid-js/store';
import { DrawState } from '../../types/DrawState';
import { Tool } from '../../types/Tool';
import LayerImageAgent from '../layer_image/LayerImageAgent';
import TileLayerImageAgent from '../layer_image/agents/TileLayerImageAgent';
import { getToolInstance } from '../tools/ToolBase';
import { setBottomInfo } from '~/components/BottomInfo';
import { LayerCanvasRef } from '~/components/canvas/stacks/LayerCanvas';
import { currentColor } from '~/stores/internal/colorStore';
import { currentTool } from '~/stores/internal/toolsStore';
import { setLayerImageStore } from '~/stores/project/layerImageStore';
import { Vec2 } from '~/types/Vector';
import { hexToRGBA } from '~/utils/colorUtils';

export default class LayerCanvasOperator {
  constructor(private readonly getActiveLayerCanvas: () => LayerCanvasRef) {}

  public handleDraw(state: DrawState, position: Vec2, last?: Vec2) {
    const layerCanvasRef = this.getActiveLayerCanvas();
    const layer = layerCanvasRef.getLayer();
    const agent = layerCanvasRef.getAgent();
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
        setLayerImageStore(layer.id, 'current', reconcile(result));

        if (agent instanceof TileLayerImageAgent) {
          (agent as TileLayerImageAgent).resetAllDirtyStates();
        }
      }
    }
  }

  private useTool(
    agent: LayerImageAgent,
    state: DrawState,
    image: ImageData,
    tool: Tool,
    position: Vec2,
    last?: Vec2
  ) {
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
        isDrawnAction = toolInstance.onStart(agent, toolArgs);
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
        setBottomInfo(
          `${tool.type} finished. ${endTime - startTime} ms. (updated ${(agent as TileLayerImageAgent).getDirtyTiles().length} dirty tiles)`
        );
      } else {
        setBottomInfo(`${tool.type} finished. ${endTime - startTime} ms.`);
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
