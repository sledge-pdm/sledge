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
