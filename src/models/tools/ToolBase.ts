import LayerImageAgent from '../layer_image/LayerImageAgent'
import { ToolType } from '../types/Tool'
import { Vec2 } from '../types/Vector'
import { EraserTool } from './eraser/EraserTool'
import { FillTool } from './fill/FillTool'
import { PenTool } from './pen/PenTool'

export interface Tool {
  onStart: (agent: LayerImageAgent, args: ToolArgs) => boolean

  onMove: (agent: LayerImageAgent, args: ToolArgs) => boolean

  onEnd: (agent: LayerImageAgent, args: ToolArgs) => boolean
}

export interface ToolArgs {
  position: Vec2
  lastPosition?: Vec2
  color: [number, number, number, number] // RGBA
  size?: number
  // TODO: pressure, tilt, ...
}

export const getToolInstance = (toolType: ToolType) => {
  switch (toolType) {
    case ToolType.Pen:
      return new PenTool()
    case ToolType.Eraser:
      return new EraserTool()
    case ToolType.Fill:
      return new FillTool()

    default:
      return new PenTool()
  }
}
