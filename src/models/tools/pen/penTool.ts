import { setPixel } from '~/utils/ImageUtils'
import { Tool, ToolArgs } from '../ToolBase'
import { drawCompletionLine, drawSquarePixel } from '../DrawUtils'
import LayerImageAgent from '~/models/layer_image/LayerImageAgent'

export class PenTool implements Tool {
  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }

  onMove(
    agent: LayerImageAgent,
    { position, lastPosition, color, size }: ToolArgs
  ) {
    const [r, g, b, a] = color

    if (!size) return false

    drawSquarePixel(position, size, (x, y) => {
      agent.setPixel({ x, y }, r, g, b, a)
    })

    if (lastPosition !== undefined)
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel(position, size, (px, py) => {
          agent.setPixel({ x: px, y: py }, r, g, b, a)
        })
      })

    return true
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }
}
