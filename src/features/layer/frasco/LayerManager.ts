import type { RawPixelData, RGBA } from '@sledge-pdm/core';
import { Layer, TextureHistoryBackend } from '@sledge-pdm/frasco';
import { LayerHistoryAction, projectHistoryController } from '~/features/history';
import { flip_pixels_vertically } from '~/utils/wasm';

type InputSpace = 'canvas' | 'layer';

type PendingLayer = {
  width: number;
  height: number;
  buffer: RawPixelData;
  inputSpace: InputSpace;
  historyMaxItems: number;
};

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private pending: Map<string, PendingLayer> = new Map();
  private gl: WebGL2RenderingContext | undefined;

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
    const layer = this.createLayer(layerId, pending.buffer, pending.width, pending.height, pending.inputSpace, pending.historyMaxItems);
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
      existing.writePixels(normalized, { width, height });
      return;
    }
    this.registerLayer(layerId, buffer, width, height, { inputSpace });
  }

  readPixelCanvas(layerId: string, x: number, y: number): RGBA | undefined {
    const layer = this.getLayerOptional(layerId);
    if (!layer || !this.isInBounds(layerId, x, y)) {
      return undefined;
    }
    const glY = layer.getHeight() - 1 - y;
    const pixels = layer.readPixels({ x, y: glY, width: 1, height: 1 });
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
  }

  private flushPending(): void {
    if (!this.gl || this.pending.size === 0) return;
    for (const [layerId, pending] of this.pending.entries()) {
      const layer = this.createLayer(layerId, pending.buffer, pending.width, pending.height, pending.inputSpace, pending.historyMaxItems);
      this.layers.set(layerId, layer);
    }
    this.pending.clear();
  }

  private createLayer(layerId: string, buffer: RawPixelData, width: number, height: number, inputSpace: InputSpace, historyMaxItems: number): Layer {
    const gl = this.getContext();
    const normalized = this.normalizeBuffer(buffer, width, height, inputSpace);
    const layer = new Layer(gl, { width, height, data: normalized });
    layer.setHistoryBackend(new TextureHistoryBackend(), historyMaxItems);
    layer.addListener('historyRegistered', (e) => {
      projectHistoryController.addAction(
        new LayerHistoryAction({
          layerId: layerId,
          context: { tool: 'tool context stub' }, // TODO: give a action context for layer?
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


