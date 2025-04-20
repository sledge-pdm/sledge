import { Vec2 } from '~/models/types/Vector'

interface DrawingBufferChangeEvent {}
interface ImageChangeEvent {}

// それぞれのLayerCanvasの描画、表示までの処理過程を記述するクラス
export default abstract class LayerImageAgent {
  protected image: ImageData
  protected drawingBuffer: ImageData | undefined

  protected onImageChangedListeners: {
    [key: string]: (e: ImageChangeEvent) => void
  } = {}
  protected onDrawingBufferChangedListeners: {
    [key: string]: (e: DrawingBufferChangeEvent) => void
  } = {}

  constructor(imageData: ImageData) {
    this.image = imageData
    this.drawingBuffer = imageData
  }

  getImage() {
    return this.image
  }

  setImage(image: ImageData) {
    this.image = image
    Object.values(this.onImageChangedListeners).forEach((listener) =>
      listener({})
    )
  }

  getDrawingBuffer() {
    return this.drawingBuffer
  }

  setDrawingBuffer(imageData?: ImageData) {
    this.drawingBuffer = imageData
    Object.values(this.onDrawingBufferChangedListeners).forEach((listener) =>
      listener({})
    )
  }

  resetDrawingBuffer() {
    this.setDrawingBuffer(undefined)
  }

  abstract putImageInto(ctx: CanvasRenderingContext2D): void
  abstract putDrawingBufferInto(ctx: CanvasRenderingContext2D): void

  setOnImageChangeListener(
    key: string,
    listener: (e: ImageChangeEvent) => void
  ) {
    this.onImageChangedListeners[key] = listener
  }

  setOnDrawingBufferChangeListener(
    key: string,
    listener: (e: DrawingBufferChangeEvent) => void
  ) {
    this.onDrawingBufferChangedListeners[key] = listener
  }

  getWidth = (): number => this.image.width
  getHeight = (): number => this.image.height

  public abstract setPixel(
    position: Vec2,
    r: number,
    g: number,
    b: number,
    a: number
  ): void

  public abstract getPixel(position: Vec2): [number, number, number, number]

  public isInBounds(position: Vec2) {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < this.getWidth() &&
      position.y < this.getHeight()
    )
  }

  // TODO: Tile処理で有効になるであろう取得関数(getPixelInRangeとか、getSelectionAreaとか？)
}
