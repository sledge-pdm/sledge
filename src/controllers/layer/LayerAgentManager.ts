import LayerImageAgent, { ImageChangeEvent } from './image/LayerImageAgent';

export class LayerAgentManager {
  private agents: Map<string, LayerImageAgent> = new Map();

  protected onAnyImageChangedListeners: {
    [key: string]: (e: ImageChangeEvent) => void;
  } = {};

  public getAgent(layerId: string): LayerImageAgent | undefined {
    return this.agents.get(layerId);
  }

  public registerAgent(layerId: string, buffer: Uint8ClampedArray, width: number, height: number): LayerImageAgent {
    const agent = new LayerImageAgent(layerId, buffer, width, height);
    Object.entries(this.onAnyImageChangedListeners).forEach(([key, listener]) => {
      agent.setOnImageChangeListener(key, listener);
    });
    this.agents.set(layerId, agent);
    return agent;
  }

  setOnAnyImageChangeListener(key: string, listener: (e: ImageChangeEvent) => void) {
    this.onAnyImageChangedListeners[key] = listener;
    this.agents.forEach((agent) => {
      agent.setOnImageChangeListener(key, listener);
    });
  }
  removeOnAnyImageChangeListener(key: string) {
    delete this.onAnyImageChangedListeners[key];
    this.agents.forEach((agent) => {
      agent.removeOnImageChangeListener(key);
    });
  }
}

export const layerAgentManager = new LayerAgentManager();

export const getBufferOf = (layerId: string) => layerAgentManager.getAgent(layerId)?.getBuffer();
