import type { Patch } from '@sledge/anvil';
import { Size2D, Vec2 } from '@sledge/core';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { eventBus } from '~/utils/EventBus';
// NOTE: 移行期間の簡易アダプタ。旧 LayerImageAgent 利用箇所を段階的に除去するためのユーティリティ。

export function getBuffer(layerId: string): Uint8ClampedArray | undefined {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return anvil.getImageData();
}

export function getBufferPointer(layerId: string): Uint8ClampedArray<ArrayBufferLike> | undefined {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return anvil.getBufferData();
}

export function setBuffer(layerId: string, buffer: Uint8ClampedArray) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  anvil.loadImageData(buffer);
}

// Whole buffer diff 登録 (clear, FX など)
export function registerWholeChange(layerId: string, before: Uint8ClampedArray, after: Uint8ClampedArray) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;
  anvil.addWholeBufferChange(before, after);
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

export function flushPatch(layerId: string): Patch | null {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return null;
  const raw = anvil.flush();
  const patch = raw ? convertLayerPatch(raw) : undefined;
  if (patch) {
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${layerId}) flush` });
    eventBus.emit('preview:requestUpdate', { layerId });
  }
  return patch ?? null;
}

export function previewPatch(layerId: string): Patch | null {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return null;
  const raw = anvil.previewPatch();
  return raw ? convertLayerPatch(raw) : null;
}

// Patch 適用 (undo / redo)。Anvil 本体未実装の差分適用をここで行う。
export function applyPatch(layerId: string, patch: Patch, mode: 'undo' | 'redo') {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;

  // Whole buffer
  if (patch.whole) {
    const target = mode === 'undo' ? patch.whole.before : patch.whole.after;
    anvil.loadImageData(target);
  }

  // Tile fills
  patch.tiles?.forEach((t) => {
    const packed = mode === 'undo' ? t.before : t.after;
    if (packed === undefined) return; // 元が非一様: pixel パッチが再構築
    const r = (packed >> 16) & 0xff;
    const g = (packed >> 8) & 0xff;
    const b = packed & 0xff;
    const a = (packed >>> 24) & 0xff;
    const tileSize = anvil.getTileSize();
    const ox = t.tile.col * tileSize;
    const oy = t.tile.row * tileSize;
    anvil.fillRect(ox, oy, tileSize, tileSize, [r, g, b, a]);
  });

  // Pixels
  patch.pixels?.forEach((p) => {
    const values = mode === 'undo' ? p.before : p.after;
    const tileSize = anvil.getTileSize();
    const ox = p.tile.col * tileSize;
    const oy = p.tile.row * tileSize;
    for (let i = 0; i < p.idx.length; i++) {
      const local = p.idx[i];
      const dx = local % tileSize;
      const dy = (local / tileSize) | 0;
      const packed = values[i] >>> 0;
      const r = (packed >> 16) & 0xff;
      const g = (packed >> 8) & 0xff;
      const b = packed & 0xff;
      const a = (packed >>> 24) & 0xff;
      anvil.setPixel(ox + dx, oy + dy, [r, g, b, a]);
    }
  });

  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${layerId}) ${mode}` });
  eventBus.emit('preview:requestUpdate', { layerId });
}

export function resize(layerId: string, newWidth: number, newHeight: number, origin?: Vec2) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return;
  if (origin) {
    anvil.resizeWithOffset(newWidth, newHeight, origin.x, origin.y);
  } else {
    anvil.resize(newWidth, newHeight);
  }
}

export function getDirtyTiles(layerId: string) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return [];
  return anvil.getDirtyTileIndices();
}

export function getTileUniformColor(layerId: string, tile: { row: number; col: number }) {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return null;
  return anvil.getTileUniformColor(tile as any);
}

// ----- helpers -----
function packRGBA(r: number, g: number, b: number, a: number) {
  return (a << 24) | (r << 16) | (g << 8) | b;
}

// Anvil の LayerPatch (RGBA配列ベース) を public Patch (packed u32) へ変換
function convertLayerPatch(raw: any): Patch {
  const out: Patch = {};
  if (raw.whole) out.whole = raw.whole; // before/after は Uint8ClampedArray で同型
  if (raw.tiles) {
    out.tiles = raw.tiles.map((t: any) => ({
      tile: t.tile,
      before: t.before ? packRGBA(t.before[0], t.before[1], t.before[2], t.before[3]) : undefined,
      after: packRGBA(t.after[0], t.after[1], t.after[2], t.after[3]),
    }));
  }
  if (raw.pixels) {
    out.pixels = raw.pixels.map((p: any) => ({
      tile: p.tile,
      idx: p.idx,
      before: new Uint32Array(p.before),
      after: new Uint32Array(p.after),
    }));
  }
  return out;
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

export function getSize(layerId: string): Size2D | undefined {
  const anvil = getAnvilOf(layerId);
  if (!anvil) return undefined;
  return {
    width: anvil.getWidth(),
    height: anvil.getHeight(),
  };
}
