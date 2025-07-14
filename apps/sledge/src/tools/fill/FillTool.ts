import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { TileFloodFill } from '~/tools/fill/TileFloodFill';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { RGBAColor } from '~/utils/ColorUtils';

export interface FillProps {
  agent: LayerImageAgent;
  color: RGBAColor;
  position: Vec2;
}
export interface Fill {
  fill: (props: FillProps) => void;
}

export class FillTool implements ToolBehavior {
  onlyOnCanvas = true;

  onStart(agent: LayerImageAgent, { position, color }: ToolArgs) {
    const fill = new TileFloodFill();
    fill.fill({ agent, color, position });

    return true;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return true;
  }
}
