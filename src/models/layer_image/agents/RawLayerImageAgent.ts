import { Vec2 } from '~/models/types/Vector'
import LayerImageAgent from '../LayerImageAgent'

export default class RawLayerImageAgent extends LayerImageAgent {
  putImageInto(ctx: CanvasRenderingContext2D) {
    ctx.putImageData(this.image, 0, 0)
  }

  putDrawingBufferInto(ctx: CanvasRenderingContext2D) {
    if (this.drawingBuffer) ctx.putImageData(this.drawingBuffer, 0, 0)
  }

  public setPixel(
    position: Vec2,
    r: number,
    g: number,
    b: number,
    a: number
  ): void {
    {
      if (
        position.x < 0 ||
        position.x >= this.getWidth() ||
        position.y < 0 ||
        position.y >= this.getHeight()
      )
        return
      const i = (position.y * this.getWidth() + position.x) * 4
      this.image.data[i + 0] = r
      this.image.data[i + 1] = g
      this.image.data[i + 2] = b
      this.image.data[i + 3] = a
    }
  }

  public getPixel(position: Vec2): [number, number, number, number] {
    const i = (position.y * this.image.width + position.x) * 4
    const d = this.image.data
    return [d[i], d[i + 1], d[i + 2], d[i + 3]]
  }
}
