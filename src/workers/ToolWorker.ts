import { expose } from 'comlink';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { TileFloodFill } from '~/tools/fill/TileFloodFill';
import { ToolArgs } from '~/tools/ToolBehavior';

const workerAPI = {
  async onStart(agent: LayerImageAgent, { position, color }: ToolArgs): Promise<boolean> {
    const fill = new TileFloodFill();
    fill.fill({ agent, color, position });
    return true;
  },
};

expose(workerAPI);
