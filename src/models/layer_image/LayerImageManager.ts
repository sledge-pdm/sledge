import LayerImageAgent from './LayerImageAgent'
import TileLayerImageAgent from './agents/TileLayerImageAgent'

export class LayerImageManager {
  private agents: Map<string, LayerImageAgent> = new Map()

  public getAgent(layerId: string): LayerImageAgent {
    return this.agents.get(layerId)!
  }

  public registerAgent(layerId: string, image: ImageData): LayerImageAgent {
    const agent = new TileLayerImageAgent(image)
    this.agents.set(layerId, agent)
    return this.getAgent(layerId)
  }
}
