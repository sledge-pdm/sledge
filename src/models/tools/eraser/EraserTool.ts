import { Tool, ToolArgs } from '../ToolBase'
import { drawCompletionLine, drawSquarePixel } from '../DrawUtils'
import LayerImageAgent from '~/models/layer_image/LayerImageAgent'

export class EraserTool implements Tool {
  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }

  onMove(
    agent: LayerImageAgent,
    { position, lastPosition, color, size }: ToolArgs
  ) {
    if (!size) return false

    drawSquarePixel(position, size, (px, py) => {
      const diff = agent.deletePixel({ x: px, y: py })
      if (diff !== undefined) {
        agent.addPixelDiffs([diff])
      }
    })

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x, y) => {
        drawSquarePixel({ x, y }, size, (px, py) => {
          const diff = agent.deletePixel({ x: px, y: py })
          if (diff !== undefined) {
            agent.addPixelDiffs([diff])
          }
        })
      })
    }

    return true
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }
}
