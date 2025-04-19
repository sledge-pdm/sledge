import { Tool, ToolArgs } from '../ToolBase'

export class PenTool implements Tool {
  onMove({ image, x, y, color }: ToolArgs) {
    const idx = (y * image.width + x) * 4
    for (let i = 0; i < 4; i++) image.data[idx + i] = color[i]
  }
}
