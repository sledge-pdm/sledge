import LayerImageAgent from '~/models/layer_image/LayerImageAgent';
import { Vec2 } from '~/types/Vector';
import { RGBAColor } from '~/utils/ColorUtils';
import { Tool, ToolArgs } from '../ToolBase';
import { TileFloodFill } from './TileFloodFill';

export interface FillProps {
  agent: LayerImageAgent;
  color: RGBAColor;
  position: Vec2;
}
export interface Fill {
  fill: (props: FillProps) => void;
}

export class FillTool implements Tool {
  onStart(agent: LayerImageAgent, { position, lastPosition, color }: ToolArgs) {
    const fill = new TileFloodFill();

    fill.fill({ agent, color, position });

    return true;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }
}
