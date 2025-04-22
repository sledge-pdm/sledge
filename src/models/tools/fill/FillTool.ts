import { Tool, ToolArgs } from '../ToolBase'
import LayerImageAgent from '~/models/layer_image/LayerImageAgent'
import { colorMatch, RGBAColor } from '~/utils/colorUtils'
import { Vec2 } from '~/models/types/Vector'
import { TileFloodFill } from './TileFloodFill'

export interface FillProps {
  agent: LayerImageAgent
  color: RGBAColor
  position: Vec2
}
export interface Fill {
  fill: (props: FillProps) => void
}

export class FillTool implements Tool {
  onStart(agent: LayerImageAgent, { position, lastPosition, color }: ToolArgs) {
    const fill = new TileFloodFill()

    fill.fill({ agent, color, position })

    return true
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }
}
