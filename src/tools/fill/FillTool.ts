import LayerImageAgent from '~/controllers/layer/image/managers/LayerImageAgent';
import { Vec2 } from '~/models/types/Vector';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { RGBAColor } from '~/utils/ColorUtils';
import { TileFloodFill } from './TileFloodFill';

export interface FillProps {
  agent: LayerImageAgent;
  color: RGBAColor;
  position: Vec2;
}
export interface Fill {
  fill: (props: FillProps) => void;
}

export class FillTool implements ToolBehavior {
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
