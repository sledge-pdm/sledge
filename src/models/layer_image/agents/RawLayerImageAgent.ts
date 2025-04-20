import { Vec2 } from '~/models/types/Vector'
import LayerImageAgent from '../LayerImageAgent'
import { PixelDiff } from '../HistoryManager'

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
    a: number,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    return this.setPixelInPosition(
      position,
      r,
      g,
      b,
      a,
      excludePositionMatch,
      excludeColorMatch
    )
  }

  public deletePixel(
    position: Vec2,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    return this.deletePixelInPosition(
      position,
      excludePositionMatch,
      excludeColorMatch
    )
  }

  public getPixel(position: Vec2): [number, number, number, number] {
    const i = (position.y * this.image.width + position.x) * 4
    const d = this.image.data
    return [d[i], d[i + 1], d[i + 2], d[i + 3]]
  }
}
