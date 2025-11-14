import type { RGBA, RawPixelData } from '@sledge/anvil';
import { PackedDiffs } from '@sledge/anvil';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { eventBus } from '~/utils/EventBus';

export function getBufferCopy(layerId: string): Uint8ClampedArray {
  return getAnvil(layerId).getBufferCopy();
}

export function getBufferPointer(layerId: string): Uint8ClampedArray<ArrayBufferLike> {
  return getAnvil(layerId).getBufferPointer();
}

export function setBuffer(layerId: string, buffer: RawPixelData) {
  getAnvil(layerId).replaceBuffer(buffer);
}

export function setPixel(layerId: string, x: number, y: number, rgba: [number, number, number, number]) {
  getAnvil(layerId).setPixel(x, y, rgba);
}

export function getPixel(layerId: string, x: number, y: number) {
  try {
    return getAnvil(layerId).getPixel(x, y);
  } catch {
    return undefined;
  }
}

export function flushPatch(layerId: string): PackedDiffs | null {
  const raw = getAnvil(layerId).flushDiffs();
  if (raw) {
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${layerId}) flush` });
    eventBus.emit('preview:requestUpdate', { layerId });
  }
  return raw ?? null;
}

export function previewPatch(layerId: string): PackedDiffs | null {
  return getAnvil(layerId).previewPatch();
}

export function getDirtyTiles(layerId: string) {
  return getAnvil(layerId).getDirtyTileIndices();
}

export function clearDirtyTiles(layerId: string) {
  getAnvil(layerId).clearDirtyTiles();
}

export function getTileUniformColor(layerId: string, tile: { row: number; col: number }) {
  return getAnvil(layerId).getTileUniformColor(tile as any);
}

export function getWidth(layerId: string) {
  return getAnvil(layerId).getWidth();
}

export function getHeight(layerId: string) {
  return getAnvil(layerId).getHeight();
}

export function exportLayerWebp(layerId: string): Uint8Array | null {
  return getAnvil(layerId).exportWebp();
}

export function exportLayerPng(layerId: string): Uint8Array | null {
  return getAnvil(layerId).exportPng();
}

export function importLayerWebp(layerId: string, buffer: Uint8Array, width: number, height: number): boolean {
  return getAnvil(layerId).importWebp(buffer, width, height);
}

export function importLayerRaw(layerId: string, buffer: RawPixelData, width: number, height: number): boolean {
  return getAnvil(layerId).importRaw(buffer, width, height);
}
