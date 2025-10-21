import { PackedDiffs } from 'node_modules/@sledge/anvil/src/types/patch/Patch';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { eventBus } from '~/utils/EventBus';

export function getBufferCopy(layerId: string): Uint8ClampedArray | undefined {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return anvil.getBufferCopy();
}

export function getBufferPointer(layerId: string): Uint8ClampedArray<ArrayBufferLike> | undefined {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return anvil.getBufferPointer();
}

export function setBuffer(layerId: string, buffer: Uint8ClampedArray) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  anvil.replaceBuffer(buffer);
}

// Whole buffer diff 登録 (clear, FX など) - swap method
export function registerWholeChange(layerId: string, swapBuffer: Uint8ClampedArray) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;
  anvil.addWholeDiff(swapBuffer);
}

export function setPixel(layerId: string, x: number, y: number, rgba: [number, number, number, number]) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;
  anvil.setPixel(x, y, rgba);
}

export function getPixel(layerId: string, x: number, y: number) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  try {
    return anvil.getPixel(x, y);
  } catch {
    return undefined;
  }
}

export function fillRect(layerId: string, x: number, y: number, w: number, h: number, rgba: [number, number, number, number]) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;
  anvil.fillRect(x, y, w, h, rgba);
}

export function flushPatch(layerId: string): PackedDiffs | null {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return null;
  const raw = anvil.flushDiffs();
  if (raw) {
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${layerId}) flush` });
    eventBus.emit('preview:requestUpdate', { layerId });
  }
  return raw ?? null;
}

export function previewPatch(layerId: string): PackedDiffs | null {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return null;
  const raw = anvil.previewPatch();
  return raw;
}

export function getDirtyTiles(layerId: string) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return [];
  return anvil.getDirtyTileIndices();
}

export function clearDirtyTiles(layerId: string) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;
  anvil.clearDirtyTiles();
}

export function getTileUniformColor(layerId: string, tile: { row: number; col: number }) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return null;
  return anvil.getTileUniformColor(tile as any);
}

export function getWidth(layerId: string) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return anvil.getWidth();
}

export function getHeight(layerId: string) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return anvil.getHeight();
}
