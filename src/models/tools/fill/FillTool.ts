import { decodeImageData, encodeImageData, setPixel } from '~/utils/ImageUtils'
import { Tool, ToolArgs } from '../ToolBase'
import LayerImageAgent from '~/models/layer_image/LayerImageAgent'
import { colorMatch } from '~/utils/colorUtils'

export class FillTool implements Tool {
  onStart(agent: LayerImageAgent, { position, lastPosition, color }: ToolArgs) {
    const targetColor = agent.getPixel(position)
    console.log(color)
    console.log(targetColor)
    const matches = (p: [number, number]) =>
      colorMatch(agent.getPixel({ x: p[0], y: p[1] }), targetColor)

    if (colorMatch(targetColor, color)) return false

    // console.log(`---${image.width}x${image.height} flood fill---`)

    const startTime = Date.now()
    const queue: [number, number][] = [[position.x, position.y]]
    const filled: [number, number][] = []
    const visited = new Uint8Array(agent.getWidth() * agent.getHeight()) // 0:未訪問, 1:訪問済
    const index = (x: number, y: number) => y * agent.getWidth() + x
    let queueCount = 0
    let visitCount = 0
    while (queue.length > 0) {
      queueCount++
      const [cx, cy] = queue.pop()!
      if (!agent.isInBounds({ x: cx, y: cy })) continue

      const i = index(cx, cy)
      if (visited[i]) continue
      visited[i] = 1
      visitCount++

      if (matches([cx, cy])) {
        filled.push([cx, cy])
        queue.push([cx + 1, cy])
        queue.push([cx - 1, cy])
        queue.push([cx, cy + 1])
        queue.push([cx, cy - 1])
      }
    }
    const endTime = Date.now()
    // console.log('new: ' + (endTime - startTime))

    // バッファに一括反映
    for (const [px, py] of filled) {
      agent.setPixel({ x: px, y: py }, color[0], color[1], color[2], color[3])
    }

    return true
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return false
  }
}
