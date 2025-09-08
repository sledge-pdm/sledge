import { activeLayer } from '~/features/layer';
import LayerImageAgent from './image/LayerImageAgent';

export class LayerAgentManager {
  private agents: Map<string, LayerImageAgent> = new Map();

  public getAgent(layerId: string): LayerImageAgent | undefined {
    return this.agents.get(layerId);
  }

  public registerAgent(layerId: string, buffer: Uint8ClampedArray, width: number, height: number): LayerImageAgent {
    const agent = new LayerImageAgent(layerId, buffer, width, height);
    this.agents.set(layerId, agent);
    return agent;
  }
}

export const layerAgentManager = new LayerAgentManager();

export const getActiveAgent = () => layerAgentManager.getAgent(activeLayer().id);
export const getAgentOf = (layerId: string) => layerAgentManager.getAgent(layerId);
export const getBufferOf = (layerId: string) => layerAgentManager.getAgent(layerId)?.getBuffer();
