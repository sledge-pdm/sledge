import { RGBA, transparent } from '@sledge-pdm/core';
import type { CompositeLayer } from '@sledge-pdm/frasco';
import { Frasco, BlendMode as FrascoBlendMode } from '@sledge-pdm/frasco';
import { flip_pixels_vertically } from '@sledge/wasm';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { getBaseLayerColor } from '~/features/layer/model';
import type { Layer } from '~/features/layer/types';
import { layerListStore } from '~/stores/ProjectStores';

const MAX_LAYERS = 16;

export class FrascoRenderer {
  private gl: WebGL2RenderingContext;
  private frasco: Frasco;
  private width = 0;
  private height = 0;
  private layers: Layer[] = [];
  private includeBaseLayer = true;
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    width: number = 0,
    height: number = 0,
    layers: Layer[] = []
  ) {
    const contextOptions: WebGLContextAttributes = {
      preserveDrawingBuffer: false,
      antialias: false,
      alpha: true,
      desynchronized: false,
      depth: true,
      stencil: false,
      premultipliedAlpha: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
    };

    const gl = canvas.getContext('webgl2', contextOptions);
    if (!gl) throw new Error('WebGL2 is not supported in this browser');
    this.gl = gl;

    layerManager.setContext(gl);
    this.frasco = new Frasco(gl);
    this.setLayers(layers);
    this.resize(width, height);
  }

  public setLayers(layers: Layer[]) {
    this.layers = [...layers];
  }

  public setIncludeBaseLayer(include: boolean) {
    this.includeBaseLayer = include;
  }

  public getIncludeBaseLayer(): boolean {
    return this.includeBaseLayer;
  }

  public resize(width: number, height: number): void {
    this.checkDisposed();
    if (width <= 0 || height <= 0) return;
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.gl.viewport(0, 0, width, height);
    this.frasco.resize({ width, height });
    layerManager.resizeAll(width, height);
  }

  public render(_onlyDirty?: boolean): void {
    this.checkDisposed();
    if (this.width === 0 || this.height === 0) return;

    const baseColor: RGBA = this.includeBaseLayer ? getBaseLayerColor(layerListStore.baseLayer) : [0, 0, 0, 0];
    const layers = this.layers.toReversed().slice(0, MAX_LAYERS);
    const composite = this.buildCompositeLayers(layers);

    this.frasco.compose(composite, { size: { width: this.width, height: this.height }, baseColor });
  }

  public renderLayersImmediate(layers: Layer[], baseColor?: RGBA): Uint8ClampedArray {
    this.checkDisposed();
    if (this.width === 0 || this.height === 0) {
      return new Uint8ClampedArray(0);
    }

    const composite = this.buildCompositeLayers(layers.toReversed().slice(0, MAX_LAYERS));
    this.frasco.compose(composite, { size: { width: this.width, height: this.height }, baseColor: baseColor ?? transparent });
    return this.readPixelsRaw();
  }

  public readPixelsFlipped(options?: { skipRender?: boolean }): Uint8ClampedArray {
    this.checkDisposed();
    if (!options?.skipRender) {
      this.render(false);
    }
    const raw = this.readPixelsRaw();
    const flipped = new Uint8Array(raw.buffer.slice(0));
    flip_pixels_vertically(flipped, this.width, this.height);
    return new Uint8ClampedArray(flipped.buffer);
  }

  public readPixelsRaw(): Uint8ClampedArray {
    this.checkDisposed();
    const raw = new Uint8Array(this.width * this.height * 4);
    this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, raw);
    return new Uint8ClampedArray(raw.buffer);
  }

  public getMaxTextureSize(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.frasco.dispose();
    layerManager.disposeAll();
    this.disposed = true;
  }

  public isDisposed(): boolean {
    return this.disposed;
  }

  private buildCompositeLayers(layers: Layer[]): CompositeLayer[] {
    const composite: CompositeLayer[] = [];
    for (const layer of layers) {
      if (!layer.enabled) continue;
      const frascoLayer = layerManager.getLayerOptional(layer.id);
      if (!frascoLayer) continue;
      composite.push({
        texture: frascoLayer.getTextureHandle(),
        opacity: layer.opacity,
        blendMode: layer.mode as unknown as FrascoBlendMode,
      });
    }
    return composite;
  }

  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('FrascoRenderer has been disposed');
    }
  }
}
