import { RGBA, transparent } from '@sledge-pdm/core';
import type { CompositeLayer } from '@sledge-pdm/frasco';
import { Frasco, BlendMode as FrascoBlendMode } from '@sledge-pdm/frasco';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { getBaseLayerColor } from '~/features/layer/model';
import type { Layer } from '~/features/layer/types';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { layerListStore } from '~/stores/ProjectStores';
import { flip_pixels_vertically } from '~/utils/WasmJSImplementation';

const MAX_LAYERS = 16;

export class FrascoRenderer {
  private gl: WebGL2RenderingContext;
  private frasco: Frasco;
  private width = 0;
  private height = 0;
  private layers: Layer[] = [];
  private includeBaseLayer = true;
  private disposed = false;
  private overlayProgram: WebGLProgram;
  private overlayVao: WebGLVertexArrayObject;
  private overlayVbo: WebGLBuffer;
  private overlayTexture: WebGLTexture;
  private overlayVersion = -1;
  private previewTexture?: WebGLTexture;
  private previewVersion = -1;

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

    this.overlayProgram = createOverlayProgram(gl);
    const overlayVao = gl.createVertexArray();
    if (!overlayVao) throw new Error('FrascoRenderer: failed to create overlay VAO');
    this.overlayVao = overlayVao;
    const overlayVbo = gl.createBuffer();
    if (!overlayVbo) throw new Error('FrascoRenderer: failed to create overlay VBO');
    this.overlayVbo = overlayVbo;
    const overlayTexture = gl.createTexture();
    if (!overlayTexture) throw new Error('FrascoRenderer: failed to create overlay texture');
    this.overlayTexture = overlayTexture;
    this.initOverlayResources();
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
    this.renderOverlay();
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
    const gl = this.gl;
    gl.deleteProgram(this.overlayProgram);
    gl.deleteVertexArray(this.overlayVao);
    gl.deleteBuffer(this.overlayVbo);
    gl.deleteTexture(this.overlayTexture);
    if (this.previewTexture) {
      gl.deleteTexture(this.previewTexture);
      this.previewTexture = undefined;
    }
    this.disposed = true;
  }

  public isDisposed(): boolean {
    return this.disposed;
  }

  private getPreviewTexture(layer: Layer): WebGLTexture | undefined {
    if (!floatingMoveManager.isMoving()) return;
    if (layer.id !== layerListStore.activeLayerId) return;
    const buffer = floatingMoveManager.getPreviewBuffer();
    if (!buffer || buffer.length !== this.width * this.height * 4) return;

    if (!this.previewTexture) {
      const tex = this.gl.createTexture();
      if (!tex) return;
      this.previewTexture = tex;
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.previewVersion = -1;
    }

    const overlayVersion = floatingMoveManager.getOverlayDescriptor()?.version ?? 0;
    if (this.previewVersion !== overlayVersion) {
      const flipped = new Uint8Array(buffer);
      flip_pixels_vertically(flipped, this.width, this.height);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.previewTexture);
      this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width, this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, flipped);
      this.previewVersion = overlayVersion;
    }

    return this.previewTexture;
  }

  private buildCompositeLayers(layers: Layer[]): CompositeLayer[] {
    const composite: CompositeLayer[] = [];
    for (const layer of layers) {
      if (!layer.enabled) continue;
      const frascoLayer = layerManager.getLayerOptional(layer.id);
      if (!frascoLayer) continue;
      const texture = this.getPreviewTexture(layer) ?? frascoLayer.getTextureHandle();
      composite.push({
        texture,
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

  private initOverlayResources(): void {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.overlayTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  private renderOverlay(): void {
    const overlay = floatingMoveManager.isMoving() ? floatingMoveManager.getOverlayDescriptor() : undefined;
    if (!overlay || overlay.width <= 0 || overlay.height <= 0) return;
    const { gl } = this;

    if (this.overlayVersion !== overlay.version) {
      const flipped = new Uint8Array(overlay.buffer.slice(0));
      flip_pixels_vertically(flipped, overlay.width, overlay.height);
      gl.bindTexture(gl.TEXTURE_2D, this.overlayTexture);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, overlay.width, overlay.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, flipped);
      this.overlayVersion = overlay.version;
    }

    const x0 = (overlay.position.x / this.width) * 2 - 1;
    const x1 = ((overlay.position.x + overlay.width) / this.width) * 2 - 1;
    const y0 = 1 - ((overlay.position.y + overlay.height) / this.height) * 2;
    const y1 = 1 - (overlay.position.y / this.height) * 2;

    const vertices = new Float32Array([x0, y1, 0, 1, x0, y0, 0, 0, x1, y1, 1, 1, x1, y1, 1, 1, x0, y0, 0, 0, x1, y0, 1, 0]);

    gl.bindVertexArray(this.overlayVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.overlayVbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    const posLoc = gl.getAttribLocation(this.overlayProgram, 'a_pos');
    const uvLoc = gl.getAttribLocation(this.overlayProgram, 'a_uv');
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    }
    if (uvLoc >= 0) {
      gl.enableVertexAttribArray(uvLoc);
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
    }

    gl.useProgram(this.overlayProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.overlayTexture);
    const texLoc = gl.getUniformLocation(this.overlayProgram, 'u_overlayTex');
    if (texLoc) gl.uniform1i(texLoc, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);

    gl.bindVertexArray(null);
    gl.useProgram(null);
  }
}

const OVERLAY_VERT_300ES = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const OVERLAY_FRAG_300ES = `#version 300 es
precision mediump float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_overlayTex;
void main() {
  outColor = texture(u_overlayTex, v_uv);
}
`;

function createOverlayProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vs = compileOverlayShader(gl, gl.VERTEX_SHADER, OVERLAY_VERT_300ES);
  const fs = compileOverlayShader(gl, gl.FRAGMENT_SHADER, OVERLAY_FRAG_300ES);
  const program = linkOverlayProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function compileOverlayShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('FrascoRenderer: failed to create overlay shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown';
    gl.deleteShader(shader);
    throw new Error(`FrascoRenderer: overlay shader compile error: ${info}`);
  }
  return shader;
}

function linkOverlayProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('FrascoRenderer: failed to create overlay program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'unknown';
    gl.deleteProgram(program);
    throw new Error(`FrascoRenderer: overlay program link error: ${info}`);
  }
  return program;
}
