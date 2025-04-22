import { Vec2 } from '~/models/types/Vector'
import { DiffAction, HistoryManager, PixelDiff } from './HistoryManager'
import { colorMatch } from '~/utils/colorUtils'
import { setBottomInfo } from '~/components/BottomInfo'

interface DrawingBufferChangeEvent {}
interface ImageChangeEvent {}

// それぞれのLayerCanvasの描画、表示までの処理過程を記述するクラス
export default abstract class LayerImageAgent {
  protected image: ImageData
  protected drawingBuffer: ImageData | undefined
  protected historyManager

  protected onImageChangedListeners: {
    [key: string]: (e: ImageChangeEvent) => void
  } = {}
  protected onDrawingBufferChangedListeners: {
    [key: string]: (e: DrawingBufferChangeEvent) => void
  } = {}

  constructor(imageData: ImageData, historyManager?: HistoryManager) {
    this.image = imageData
    this.drawingBuffer = imageData
    this.historyManager = historyManager
  }

  getImage() {
    return this.image
  }

  setImage(image: ImageData, silentlySet?: boolean) {
    this.image = image
    if (silentlySet) this.callOnImageChangeListeners()
    this.resetDrawingBuffer()
  }

  getDrawingBuffer() {
    return this.drawingBuffer
  }

  setDrawingBuffer(imageData?: ImageData) {
    this.drawingBuffer = imageData
    this.callOnDrawingBufferChangeListeners()
  }

  resetDrawingBuffer() {
    this.setDrawingBuffer(this.image)
  }

  abstract putImageInto(ctx: CanvasRenderingContext2D): void
  abstract putDrawingBufferInto(ctx: CanvasRenderingContext2D): void

  putImageIntoForce(ctx: CanvasRenderingContext2D) {
    ctx.putImageData(this.image, 0, 0)
  }
  putDrawingBufferIntoForce(ctx: CanvasRenderingContext2D) {
    if (this.drawingBuffer) ctx.putImageData(this.drawingBuffer, 0, 0)
  }

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

  callOnImageChangeListeners() {
    Object.values(this.onImageChangedListeners).forEach((listener) =>
      listener({})
    )
  }

  callOnDrawingBufferChangeListeners() {
    Object.values(this.onDrawingBufferChangedListeners).forEach((listener) =>
      listener({})
    )
  }

  getWidth = (): number => this.image.width
  getHeight = (): number => this.image.height

  public currentDiffAction: DiffAction = { diffs: new Map() }

  public addPixelDiffs(diffs: PixelDiff[]) {
    diffs.forEach((d) => {
      this.currentDiffAction.diffs.set(`${d.position.x},${d.position.y}`, d)
    })
  }

  public registerDiffAction() {
    this.historyManager?.addAction(this.currentDiffAction)
    this.currentDiffAction = { diffs: new Map() }
  }

  public canUndo = () => this.historyManager?.canUndo()
  public canRedo = () => this.historyManager?.canRedo()

  public undo() {
    const undoedAction = this.historyManager?.undo()
    if (undoedAction === undefined) return
    setBottomInfo(`undo.`)
    undoedAction.diffs.forEach((pxDiff) => {
      this.setPixelInPosition(
        pxDiff.position,
        pxDiff.before[0],
        pxDiff.before[1],
        pxDiff.before[2],
        pxDiff.before[3],
        false,
        false
      )
    })
    setBottomInfo(`undo done. (${undoedAction.diffs.size} px updated)`)

    this.callOnImageChangeListeners()
  }

  public redo() {
    const redoedAction = this.historyManager?.redo()
    if (redoedAction === undefined) return
    setBottomInfo(`redo.`)
    redoedAction.diffs.forEach((pxDiff) => {
      this.setPixelInPosition(
        pxDiff.position,
        pxDiff.after[0],
        pxDiff.after[1],
        pxDiff.after[2],
        pxDiff.after[3],
        false,
        false
      )
    })
    setBottomInfo(`redo done. (${redoedAction.diffs.size} px updated)`)

    this.callOnImageChangeListeners()
  }

  public abstract setPixel(
    position: Vec2,
    r: number,
    g: number,
    b: number,
    a: number,
    excludePositionMatch: boolean,
    excludeColorMatch: boolean
  ): PixelDiff | undefined

  protected setPixelInPosition(
    position: Vec2,
    r: number,
    g: number,
    b: number,
    a: number,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    if (!this.isInBounds(position)) return undefined
    if (
      excludePositionMatch &&
      this.currentDiffAction.diffs.has(`${position.x},${position.y}`)
    )
      return undefined
    const i = (position.y * this.getWidth() + position.x) * 4
    const beforeColor: [number, number, number, number] = [
      this.image.data[i + 0],
      this.image.data[i + 1],
      this.image.data[i + 2],
      this.image.data[i + 3],
    ]
    if (excludeColorMatch && colorMatch(beforeColor, [r, g, b, a]))
      return undefined

    if (!this.drawingBuffer) return

    this.drawingBuffer.data[i + 0] = r
    this.drawingBuffer.data[i + 1] = g
    this.drawingBuffer.data[i + 2] = b
    this.drawingBuffer.data[i + 3] = a

    return {
      position,
      before: beforeColor,
      after: [r, g, b, a],
    }
  }

  public abstract deletePixel(
    position: Vec2,
    excludePositionMatch: boolean,
    excludeColorMatch: boolean
  ): PixelDiff | undefined

  protected deletePixelInPosition(
    position: Vec2,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    return this.setPixelInPosition(
      position,
      0,
      0,
      0,
      0,
      excludePositionMatch,
      excludeColorMatch
    )
  }

  public abstract getPixel(position: Vec2): [number, number, number, number]

  public isInBounds(position: Vec2) {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < this.getWidth() &&
      position.y < this.getHeight()
    )
  }
}
