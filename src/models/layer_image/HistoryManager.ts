import {
  layerImageStore,
  setLayerImageStore,
} from '~/stores/project/layerImageStore'
import { Vec2 } from '../types/Vector'
import { reconcile } from 'solid-js/store'

export type PixelDiff = {
  position: Vec2
  before: [number, number, number, number] // undo時の色
  after: [number, number, number, number] // redo時の色
}

export type DiffAction = {
  diffs: Map<string, PixelDiff>
}

export class HistoryManager {
  protected undoActionsStack: DiffAction[]
  protected redoActionsStack: DiffAction[]

  constructor(public layerId: string) {
    this.undoActionsStack = []
    this.redoActionsStack = []
  }

  public canUndo() {
    return this.undoActionsStack.length > 0
  }

  public canRedo() {
    return this.redoActionsStack.length > 0
  }

  public addAction(action: DiffAction) {
    this.undoActionsStack.push(action)
    setLayerImageStore(
      this.layerId,
      'undoStack',
      reconcile([...this.undoActionsStack])
    )
    setLayerImageStore(
      this.layerId,
      'redoStack',
      reconcile([...this.redoActionsStack])
    )
  }

  public undo(): DiffAction | undefined {
    const undoedAction = this.undoActionsStack.pop()
    if (undoedAction === undefined) return undefined
    this.redoActionsStack = [undoedAction, ...this.redoActionsStack]
    setLayerImageStore(
      this.layerId,
      'undoStack',
      reconcile([...this.undoActionsStack])
    )
    setLayerImageStore(
      this.layerId,
      'redoStack',
      reconcile([...this.redoActionsStack])
    )
    return undoedAction
  }

  public redo(): DiffAction | undefined {
    const redoedAction = this.redoActionsStack.shift()
    if (redoedAction === undefined) return undefined
    this.undoActionsStack = [...this.undoActionsStack, redoedAction]
    setLayerImageStore(
      this.layerId,
      'undoStack',
      reconcile([...this.undoActionsStack])
    )
    setLayerImageStore(
      this.layerId,
      'redoStack',
      reconcile([...this.redoActionsStack])
    )
    return redoedAction
  }
}
