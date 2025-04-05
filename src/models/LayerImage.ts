import { canvasStore, setImageStore, updateDSL } from "../stores/Store";

export type LayerImageState = {
  current: ImageData;
  DSLcurrent?: ImageData;
  undoStack: ImageData[];
  redoStack: ImageData[];
};

export function initImageForLayer(layerId: string, dotMagnification: number) {
  const blank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification),
  );
  const dslBlank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification),
  );
  setImageStore(layerId, {
    current: blank,
    DSLcurrent: dslBlank,
    undoStack: [],
    redoStack: [],
  });
}

export function updateImageData(layerId: string, newData: ImageData) {
  setImageStore(layerId, (state: LayerImageState) => {
    const prev = state.current;
    return {
      current: newData,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    };
  });
}

export function undo(layerId: string) {
  console.log("undo");
  setImageStore(layerId, (state) => {
    if (state.undoStack.length === 0) return state;
    const prev = state.undoStack[state.undoStack.length - 1];
    const newUndo = state.undoStack.slice(0, -1);
    const newRedo = [state.current, ...state.redoStack];
    return { current: prev, undoStack: newUndo, redoStack: newRedo };
  });
  updateDSL(layerId);
}

export function redo(layerId: string) {
  setImageStore(layerId, (state) => {
    if (state.redoStack.length === 0) return state;
    const next = state.redoStack[0];
    const newRedo = state.redoStack.slice(1);
    const newUndo = [...state.undoStack, state.current];
    return { current: next, undoStack: newUndo, redoStack: newRedo };
  });
  updateDSL(layerId);
}

export function cloneImageData(src: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(src.data), // ← 必ず新しい配列
    src.width,
    src.height,
  );
}
