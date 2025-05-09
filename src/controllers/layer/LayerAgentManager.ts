import { HistoryManager } from '~/models/history/HistoryManager';
import LayerImageAgent from './LayerImageAgent';
import TileLayerImageAgent from './agents/TileLayerImageAgent';

export class LayerAgentManager {
  private agents: Map<string, LayerImageAgent> = new Map();

  public getAgent(layerId: string): LayerImageAgent | undefined {
    return this.agents.get(layerId);
  }

  public registerAgent(layerId: string, image: ImageData): LayerImageAgent {
    const agent = new TileLayerImageAgent(image, new HistoryManager(layerId));
    this.agents.set(layerId, agent);
    return agent;
  }
}
