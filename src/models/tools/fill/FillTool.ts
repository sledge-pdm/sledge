import { decodeImageData, encodeImageData, setPixel } from '~/utils/ImageUtils'
import { Tool, ToolArgs } from '../ToolBase'
import LayerImageAgent from '~/models/layer_image/LayerImageAgent'
import { colorMatch } from '~/utils/colorUtils'
import { Vec2 } from '~/models/types/Vector'
import { PixelDiff } from '~/models/layer_image/HistoryManager'

export class FillTool implements Tool {
  onStart(agent: LayerImageAgent, { position, lastPosition, color }: ToolArgs) {
    const targetColor = agent.getPixel(position)
    console.log(color)
    console.log(targetColor)
    const matches = (p: Vec2) => colorMatch(agent.getPixel(p), targetColor)

    if (colorMatch(targetColor, color)) return false

    // console.log(`---${image.width}x${image.height} flood fill---`)

    const startTime = Date.now()
    const queue: Vec2[] = [position]
    const filled: Vec2[] = []
    const visited = new Uint8Array(agent.getWidth() * agent.getHeight()) // 0:未訪問, 1:訪問済
    const index = (p: Vec2) => p.y * agent.getWidth() + p.x
    let queueCount = 0
    let visitCount = 0
    while (queue.length > 0) {
      queueCount++
      const c = queue.pop()!
      if (!agent.isInBounds(c)) continue

      const i = index(c)
      if (visited[i]) continue
      visited[i] = 1
      visitCount++

      if (matches(c)) {
        filled.push(c)
        queue.push({ x: c.x + 1, y: c.y })
        queue.push({ x: c.x - 1, y: c.y })
        queue.push({ x: c.x, y: c.y + 1 })
        queue.push({ x: c.x, y: c.y - 1 })
      }
    }
    const endTime = Date.now()
    // console.log('new: ' + (endTime - startTime))

    const pxDiffs: PixelDiff[] = []
    // バッファに一括反映
    for (const p of filled) {
      const diff = agent.setPixel(p, color[0], color[1], color[2], color[3])
      if (diff !== undefined) pxDiffs.push(diff)
    }

    agent.addPixelDiffs(pxDiffs)

    return true
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }
}
