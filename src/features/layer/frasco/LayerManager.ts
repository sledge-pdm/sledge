import type { RawPixelData, RGBA } from '@sledge-pdm/core';
import { HistoryPackedSnapshot, Layer, SurfaceBounds, TextureHistoryBackend } from '@sledge-pdm/frasco';
import { registerCommandsHistory } from '~/features/history';
import { FrascoLayerCommand } from '~/features/history/commands';
import { flip_pixels_vertically } from '~/utils/wasm';
import { LayerBufferCache } from './LayerBufferCache';

type InputSpace = 'canvas' | 'layer';

type PendingLayer = {
  width: number;
  height: number;
  buffer: RawPixelData;
  inputSpace: InputSpace;
  historyMaxItems: number;
  historyPacked?: { undoStack: HistoryPackedSnapshot[]; redoStack: HistoryPackedSnapshot[] };
};

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private pending: Map<string, PendingLayer> = new Map();
  private gl: WebGL2RenderingContext | undefined;
  /** shares the lifetime of `layers`, so a cached buffer can never outlive the layer it belongs to. */
  readonly bufferCache = new LayerBufferCache();

  setContext(gl: WebGL2RenderingContext) {
    if (this.gl === gl) return;
    this.disposeAll();
    this.gl = gl;
    this.flushPending();
  }

  getContext(): WebGL2RenderingContext {
    if (!this.gl) {
      throw new Error('LayerManager: WebGL2 context not set');
    }
    return this.gl;
  }

  registerLayer(
    layerId: string,
    buffer: RawPixelData,
    width: number,
    height: number,
    options?: { inputSpace?: InputSpace; historyMaxItems?: number }
  ): Layer | undefined {
    const inputSpace = options?.inputSpace ?? 'canvas';
    const historyMaxItems = options?.historyMaxItems ?? 100;
    // whatever was cached describes the layer this call is replacing.
    this.bufferCache.invalidate(layerId);
    const existing = this.layers.get(layerId);
    if (existing) {
      existing.dispose();
      this.layers.delete(layerId);
    }
    if (!this.gl) {
      this.pending.set(layerId, { width, height, buffer, inputSpace, historyMaxItems });
      return undefined;
    }
    const layer = this.createLayer(layerId, buffer, width, height, inputSpace, historyMaxItems);
    this.layers.set(layerId, layer);

    return layer;
  }

  removeLayer(layerId: string): void {
    this.bufferCache.invalidate(layerId);
    this.pending.delete(layerId);
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.dispose();
      this.layers.delete(layerId);
    }
  }

  getLayer(layerId: string): Layer {
    const existing = this.layers.get(layerId);
    if (existing) return existing;
    const pending = this.pending.get(layerId);
    if (!pending) throw new Error(`LayerManager: layer not found for layerId: ${layerId}`);
    if (!this.gl) throw new Error('LayerManager: WebGL2 context not set');
    const layer = this.createLayer(
      layerId,
      pending.buffer,
      pending.width,
      pending.height,
      pending.inputSpace,
      pending.historyMaxItems,
      pending.historyPacked
    );
    this.pending.delete(layerId);
    this.layers.set(layerId, layer);
    return layer;
  }

  getLayerOptional(layerId: string): Layer | undefined {
    try {
      return this.getLayer(layerId);
    } catch {
      return undefined;
    }
  }

  resizeAll(width: number, height: number): void {
    for (const layer of this.layers.values()) {
      layer.resizeClear(width, height);
    }
  }

  exportRawCanvas(layerId: string): Uint8ClampedArray {
    const layer = this.layers.get(layerId);
    if (layer) {
      const raw = layer.readPixels({ flipY: true });
      return new Uint8ClampedArray(raw.buffer);
    }
    const pending = this.pending.get(layerId);
    if (!pending) {
      throw new Error(`LayerManager: layer not found for layerId: ${layerId}`);
    }
    const raw = new Uint8Array(pending.buffer.length);
    raw.set(pending.buffer);
    if (pending.inputSpace === 'layer') {
      flip_pixels_vertically(raw, pending.width, pending.height);
    }
    return new Uint8ClampedArray(raw.buffer);
  }

  replaceLayerBuffer(layerId: string, buffer: RawPixelData, width: number, height: number, options?: { inputSpace?: InputSpace }): void {
    const inputSpace = options?.inputSpace ?? 'canvas';
    const normalized = new Uint8Array(buffer.length);
    normalized.set(buffer);
    if (inputSpace === 'canvas') {
      flip_pixels_vertically(normalized, width, height);
    }
    const existing = this.getLayerOptional(layerId);
    if (existing) {
      const bounds: SurfaceBounds = { x: 0, y: 0, width, height };
      existing.writePixels(normalized, { bounds });
      return;
    }
    this.registerLayer(layerId, buffer, width, height, { inputSpace });
  }

  /**
   * @description load history straight from the deflated bytes on disk. frasco keeps those bytes on the
   *   snapshots it builds, so the first save after opening a project does not have to compress them again.
   */
  importHistoryPacked(layerId: string, undoStack: HistoryPackedSnapshot[], redoStack: HistoryPackedSnapshot[]): void {
    const existing = this.layers.get(layerId);
    if (existing) {
      existing.importHistoryPacked(undoStack, redoStack);
      return;
    }
    const pending = this.pending.get(layerId);
    if (pending) {
      pending.historyPacked = { undoStack, redoStack };
    }
  }

  readPixelCanvas(layerId: string, x: number, y: number): RGBA | undefined {
    const layer = this.getLayerOptional(layerId);
    if (!layer || !this.isInBounds(layerId, x, y)) {
      return undefined;
    }
    const glY = layer.getHeight() - 1 - y;
    const bounds: SurfaceBounds = { x, y: glY, width: 1, height: 1 };
    const pixels = layer.readPixels({ bounds });
    return [pixels[0], pixels[1], pixels[2], pixels[3]];
  }

  isInBounds(layerId: string, x: number, y: number): boolean {
    const layer = this.getLayer(layerId);
    return x >= 0 && y >= 0 && x < layer.getWidth() && y < layer.getHeight();
  }

  disposeAll(): void {
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
    this.bufferCache.clear();
  }

  private flushPending(): void {
    if (!this.gl || this.pending.size === 0) return;
    for (const [layerId, pending] of this.pending.entries()) {
      const layer = this.createLayer(
        layerId,
        pending.buffer,
        pending.width,
        pending.height,
        pending.inputSpace,
        pending.historyMaxItems,
        pending.historyPacked
      );
      this.layers.set(layerId, layer);
    }
    this.pending.clear();
  }

  private createLayer(
    layerId: string,
    buffer: RawPixelData,
    width: number,
    height: number,
    inputSpace: InputSpace,
    historyMaxItems: number,
    historyPacked?: { undoStack: HistoryPackedSnapshot[]; redoStack: HistoryPackedSnapshot[] }
  ): Layer {
    const gl = this.getContext();
    const normalized = this.normalizeBuffer(buffer, width, height, inputSpace);
    const layer = new Layer(gl, { width, height, data: normalized });
    layer.setHistoryBackend(new TextureHistoryBackend(), historyMaxItems);
    if (historyPacked) {
      layer.importHistoryPacked(historyPacked.undoStack, historyPacked.redoStack);
    }
    // every route that touches pixels emits 'update', undo/redo included - they land on the layer through
    // drawTexture. resize emits it too, but 'resized' is kept as a second source so that a frasco which
    // does not yet do so cannot leave a resized layer looking untouched.
    layer.addListener('update', () => this.bufferCache.invalidate(layerId));
    layer.addListener('resized', () => this.bufferCache.invalidate(layerId));
    layer.addListener('historyRegistered', (e) => {
      registerCommandsHistory(
        new FrascoLayerCommand({
          layerId: layerId,
          context: e.context,
        })
      );
    });
    return layer;
  }

  private normalizeBuffer(buffer: RawPixelData, width: number, height: number, inputSpace: InputSpace): Uint8Array {
    const raw = new Uint8Array(buffer.length);
    raw.set(buffer);
    if (inputSpace === 'canvas') {
      flip_pixels_vertically(raw, width, height);
    }
    return raw;
  }
}

export const layerManager = new LayerManager();
export const getLayer = (layerId: string): Layer => layerManager.getLayer(layerId);
