import { Point, RawPixelData, RGBA, Size, toUint8Array, toUint8ClampedArray } from '@sledge/anvil';
import { AlphaBlurMode, AntialiasMode, DitheringMode, RgbaBuffer } from '../../../../packages/anvil/src/ops_wasm/pkg/anvil_ops_wasm.js';

/**
 * Core pixel buffer operations - raw RGBA8 array management
 * Model responsibility: owns buffer state, provides bounds-checked access
 */
export class JSWrapperRgbaBuffer {
  public width: number;
  public height: number;
  private wasmBuffer: RgbaBuffer;
  private dataView!: Uint8ClampedArray;

  constructor(width: number, height: number, initialData?: RawPixelData) {
    this.width = width;
    this.height = height;
    this.wasmBuffer = new RgbaBuffer(width, height);
    this.refreshDataView();

    if (initialData) {
      const clamped = toUint8ClampedArray(initialData);
      if (clamped.length !== width * height * 4) {
        throw new Error(`Buffer size mismatch: expected ${width * height * 4}, got ${clamped.length}`);
      }
      this.data.set(clamped);
    } else if (this.data.length !== width * height * 4) {
      throw new Error(`Buffer size mismatch: expected ${width * height * 4}, got ${this.data.length}`);
    }
  }

  public get data(): Uint8ClampedArray {
    return this.ensureDataView();
  }

  static fromRaw(width: number, height: number, rawBuffer: RawPixelData): JSWrapperRgbaBuffer {
    return new JSWrapperRgbaBuffer(width, height, rawBuffer);
  }

  static fromWebp(width: number, height: number, webpBuffer: Uint8Array): JSWrapperRgbaBuffer {
    const buffer = new JSWrapperRgbaBuffer(width, height);
    buffer.importWebp(webpBuffer, width, height);
    return buffer;
  }

  static fromPng(width: number, height: number, pngBuffer: Uint8Array): JSWrapperRgbaBuffer {
    const buffer = new JSWrapperRgbaBuffer(width, height);
    buffer.importPng(pngBuffer, width, height);
    return buffer;
  }

  private ensureDataView(): Uint8ClampedArray {
    if (this.dataView.byteLength === 0) {
      this.refreshDataView();
    }
    return this.dataView;
  }

  private refreshDataView(): void {
    // wasm 側が Uint8ClampedArray を返すのでそのまま保持する
    this.dataView = this.wasmBuffer.data();
  }

  /**
   * Get pixel color at coordinates (bounds-checked)
   */
  get(x: number, y: number): RGBA {
    if (!this.isInBounds(x, y)) {
      return [0, 0, 0, 0]; // transparent black for out-of-bounds
    }

    const idx = (y * this.width + x) * 4;
    const data = this.data;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  /**
   * Get pixel color at raw buffer index (length-checked)
   */
  indexGet(idx: number): RGBA {
    if (0 < idx || idx >= this.data.length - 4) {
      return [0, 0, 0, 0];
    }

    const data = this.data;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  /**
   * Set pixel color at coordinates (bounds-checked)
   * Returns true if pixel was actually changed
   */
  set(x: number, y: number, color: RGBA): boolean {
    if (!this.isInBounds(x, y)) {
      return false;
    }

    const idx = (y * this.width + x) * 4;
    const data = this.data;
    const changed = data[idx] !== color[0] || data[idx + 1] !== color[1] || data[idx + 2] !== color[2] || data[idx + 3] !== color[3];

    if (changed) {
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    }

    return changed;
  }

  /**
   * Set pixel color at raw buffer index
   * Returns true if pixel was actually changed
   */
  indexSet(idx: number, color: RGBA): boolean {
    if (0 < idx || idx >= this.data.length - 4) {
      return false;
    }

    const data = this.data;
    const changed = data[idx] !== color[0] || data[idx + 1] !== color[1] || data[idx + 2] !== color[2] || data[idx + 3] !== color[3];

    if (changed) {
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    }

    return changed;
  }

  /**
   * Check if coordinates are within buffer bounds
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Resize buffer with optional source/destination origins for cropping/pasting
   */
  resize(
    newSize: Size,
    options?: {
      srcOrigin?: Point;
      destOrigin?: Point;
    }
  ): void {
    const srcOrigin = options?.srcOrigin ?? { x: 0, y: 0 };
    const destOrigin = options?.destOrigin ?? { x: 0, y: 0 };

    this.wasmBuffer.resize_with_origins(newSize.width, newSize.height, srcOrigin.x, srcOrigin.y, destOrigin.x, destOrigin.y);
    this.refreshDataView();
    this.width = newSize.width;
    this.height = newSize.height;
  }

  /**
   * Create a copy of this buffer
   */
  clone(): JSWrapperRgbaBuffer {
    return new JSWrapperRgbaBuffer(this.width, this.height, new Uint8ClampedArray(this.data));
  }

  /**
   * Fill entire buffer with a single color
   */
  fill(color: RGBA): void {
    const [r, g, b, a] = color;
    const data = this.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  exportWebp(): Uint8Array {
    return this.wasmBuffer.exportWebp();
  }

  exportPng(): Uint8Array {
    return this.wasmBuffer.exportPng();
  }

  importRaw(buffer: RawPixelData, width: number, height: number): boolean {
    const view = toUint8Array(buffer);
    const ok = this.wasmBuffer.importRaw(view, width, height);
    if (ok) {
      this.width = width;
      this.height = height;
      this.refreshDataView();
    }
    return ok;
  }

  importWebp(buffer: Uint8Array, width: number, height: number): boolean {
    const ok = this.wasmBuffer.importWebp(buffer, width, height);
    if (ok) {
      this.width = width;
      this.height = height;
      this.refreshDataView();
    }
    return ok;
  }

  importPng(buffer: Uint8Array, width: number, height: number): boolean {
    const ok = this.wasmBuffer.importPng(buffer, width, height);
    if (ok) {
      this.width = width;
      this.height = height;
      this.refreshDataView();
    }
    return ok;
  }

  fillMaskArea(mask: Uint8Array, color: RGBA) {
    return this.wasmBuffer.fillMaskArea(mask, color[0], color[1], color[2], color[3]);
  }

  floodFill(
    startX: number,
    startY: number,
    color: RGBA,
    options?: {
      threshold?: number;
      mask?: {
        buffer: Uint8Array;
        mode: 'inside' | 'outside' | 'none';
      };
    }
  ): boolean {
    const threshold = options?.threshold ?? 0;
    if (options?.mask && options.mask.mode !== 'none') {
      return this.wasmBuffer.floodFillWithMask(
        startX,
        startY,
        color[0],
        color[1],
        color[2],
        color[3],
        threshold,
        options.mask.buffer,
        options.mask.mode
      );
    }

    return this.wasmBuffer.floodFill(startX, startY, color[0], color[1], color[2], color[3], threshold);
  }

  transferFromRaw(source: RawPixelData, width: number, height: number, options?: TransferOptions): void {
    const view = toUint8Array(source);
    const {
      offsetX = 0,
      offsetY = 0,
      scaleX = 1,
      scaleY = 1,
      rotate = 0,
      flipX = false,
      flipY = false,
      antialiasMode = AntialiasMode.Nearest,
    } = options ?? {};

    this.wasmBuffer.blitFromRaw(view, width, height, offsetX, offsetY, scaleX, scaleY, rotate, antialiasMode, flipX, flipY);
    this.refreshDataView();
  }

  transferFromBuffer(source: JSWrapperRgbaBuffer, options?: TransferOptions): void {
    const {
      offsetX = 0,
      offsetY = 0,
      scaleX = 1,
      scaleY = 1,
      rotate = 0,
      flipX = false,
      flipY = false,
      antialiasMode = AntialiasMode.Nearest,
    } = options ?? {};

    this.wasmBuffer.blitFromBuffer(source.wasmBuffer, offsetX, offsetY, scaleX, scaleY, rotate, antialiasMode, flipX, flipY);
    this.refreshDataView();
  }

  sliceWithMask(mask: RawPixelData, maskWidth: number, maskHeight: number, options?: MaskOptions): Uint8ClampedArray {
    const maskView = toUint8Array(mask);
    const data = this.wasmBuffer.sliceWithMask(maskView, maskWidth, maskHeight, options?.offsetX ?? 0, options?.offsetY ?? 0);
    return new Uint8ClampedArray(data.buffer);
  }

  cropWithMask(mask: RawPixelData, maskWidth: number, maskHeight: number, options?: MaskOptions): Uint8ClampedArray {
    const maskView = toUint8Array(mask);
    const data = this.wasmBuffer.cropWithMask(maskView, maskWidth, maskHeight, options?.offsetX ?? 0, options?.offsetY ?? 0);
    return new Uint8ClampedArray(data.buffer);
  }

  readRect(x: number, y: number, width: number, height: number): Uint8ClampedArray {
    if (width <= 0 || height <= 0) {
      return new Uint8ClampedArray(0);
    }
    const data = this.wasmBuffer.readRect(x, y, width, height);
    return toUint8ClampedArray(data);
  }

  writeRect(x: number, y: number, width: number, height: number, source: RawPixelData): boolean {
    if (width <= 0 || height <= 0) {
      return false;
    }
    const view = toUint8Array(source);
    return this.wasmBuffer.writeRect(x, y, width, height, view);
  }

  writePixels(coords: Uint32Array, colors: Uint8Array): boolean {
    if (coords.length === 0 || colors.length === 0) {
      return true;
    }
    if (coords.length / 2 !== colors.length / 4) {
      return false;
    }
    return this.wasmBuffer.writePixels(coords, colors);
  }

  invert(): void {
    this.wasmBuffer.invert();
    this.refreshDataView();
  }

  grayscale(): void {
    this.wasmBuffer.grayscale();
    this.refreshDataView();
  }

  gaussianBlur(radius: number, alphaMode: AlphaBlurMode): void {
    this.wasmBuffer.gaussianBlur(radius, alphaMode);
    this.refreshDataView();
  }

  posterize(levels: number): void {
    this.wasmBuffer.posterize(levels);
    this.refreshDataView();
  }

  dustRemoval(maxSize: number, alphaThreshold: number): void {
    this.wasmBuffer.dustRemoval(maxSize, alphaThreshold);
    this.refreshDataView();
  }

  dithering(mode: DitheringMode, levels: number, strength: number): void {
    this.wasmBuffer.dithering(mode, levels, strength);
    this.refreshDataView();
  }

  brightnessAndContrast(brightness: number, contrast: number): void {
    this.wasmBuffer.brightnessAndContrast(brightness, contrast);
    this.refreshDataView();
  }
}

export interface TransferOptions {
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  offsetX?: number;
  offsetY?: number;
  flipX?: boolean;
  flipY?: boolean;
  antialiasMode?: AntialiasMode;
}

export interface MaskOptions {
  offsetX?: number;
  offsetY?: number;
}
