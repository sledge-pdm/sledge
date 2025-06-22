import { Vec2 } from '~/models/types/Vector';
import { interactStore } from '~/stores/EditorStores';

export function getRelativeCanvasAreaPosition(canvasPos: Vec2) {
  const offsetX = interactStore.offsetOrigin.x + interactStore.offset.x;
  const offsetY = interactStore.offsetOrigin.y + interactStore.offset.y;
  return {
    x: offsetX + canvasPos.x * interactStore.zoom,
    y: offsetY + canvasPos.y * interactStore.zoom,
  };
}
