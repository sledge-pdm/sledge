import { showToast } from '~/stores/internal/toastStore'
import { imageStore, setImageStore } from '~/stores/project/imageStore'

export function undo(layerId: string) {
  setImageStore(layerId, (state) => {
    if (state.undoStack.length === 0) return state
    const prev = state.undoStack[state.undoStack.length - 1]
    const newUndo = state.undoStack.slice(0, -1)
    const newRedo = [state.current, ...state.redoStack]
    return { current: prev, undoStack: newUndo, redoStack: newRedo }
  })
  // updateDSL(layerId);
}

export function isUndoPossible(layerId: string) {
  return imageStore[layerId]?.undoStack?.length !== 0
}

export function redo(layerId: string) {
  showToast('redo succeeded', 'success')
  setImageStore(layerId, (state) => {
    if (state.redoStack.length === 0) return state
    const next = state.redoStack[0]
    const newRedo = state.redoStack.slice(1)
    const newUndo = [...state.undoStack, state.current]
    return { current: next, undoStack: newUndo, redoStack: newRedo }
  })
  // updateDSL(layerId);
}

export function isRedoPossible(layerId: string) {
  return imageStore[layerId]?.redoStack?.length !== 0
}
