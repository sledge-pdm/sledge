import { BlendMode, Layer } from '~/types/Layer';
import { Consts } from '~/utils/consts';
import { createFullScreenQuad } from './GeometryUtils';
import { createProgramFromSources, deleteProgramSafe } from './ShaderUtils';
import { TextureManager } from './TextureManager';
// shaders
import fragmentSrc from '~/shaders/blend.frag.glsl';
import vertexSrc from '~/shaders/fullscreen.vert.glsl';
import { blobToDataURL } from '~/utils/BlobUtils';

export class WebGLCanvasController {
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private textureMgr!: TextureManager;
  private animationId: number = 0;
  private uActiveCountLoc!: WebGLUniformLocation;
  private uOpacitiesLoc!: WebGLUniformLocation;
  private uBlendModesLoc!: WebGLUniformLocation;

  constructor(
    private canvas: HTMLCanvasElement,
    private maxLayers = Consts.maxLayerSize
  ) {}

  init(layers: Layer[]) {
    // 1) Context
    this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false })!;
    if (!this.gl) throw new Error('WebGL not supported');

    // 2) Shader + Program
    this.program = createProgramFromSources(this.gl, vertexSrc, fragmentSrc);
    this.gl.useProgram(this.program);

    // 3) Geometry
    createFullScreenQuad(this.gl, this.program);

    // 4) Texture Manager
    this.textureMgr = new TextureManager(this.gl, this.program, this.maxLayers);
    this.textureMgr.setupInitialTextures(layers);

    // 5) Render Loop
    this.renderLoop();

    // プログラム生成後に uniform のロケーション取得
    this.uActiveCountLoc = this.gl.getUniformLocation(this.program, 'u_activeCount')!;
    this.uOpacitiesLoc = this.gl.getUniformLocation(this.program, 'u_opacities')!;
    this.uBlendModesLoc = this.gl.getUniformLocation(this.program, 'u_blendModes')!;
    // 初期値セット
    this.gl.uniform1i(this.uActiveCountLoc, layers.filter((l) => l.enabled).length);
  }

  resize(width: number, height: number, dpr = window.devicePixelRatio) {
    const w = width * dpr;
    const h = height * dpr;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, w, h);

    this.textureMgr.resizeOffscreens(width, height, dpr);
  }

  updateLayers(layers: Layer[]) {
    const active = layers.filter((l) => l.enabled).slice(0, this.maxLayers);
    const prev = [...this.textureMgr.layerIds];
    const next = active.map((l) => l.id);

    const n = Math.max(prev.length, next.length);
    for (let i = 0; i < n; i++) {
      const oldId = prev[i];
      const newId = next[i];
      if (oldId === newId) continue;

      if (newId != null) {
        const newLayer = active.find((l) => l.id === newId)!;
        this.textureMgr.createTextureSlot(i, newLayer);
      } else {
        this.textureMgr.clearTextureSlot(i);
      }
    }

    this.gl.useProgram(this.program);

    const opacities = new Float32Array(16).fill(0);
    const blendModes = new Int32Array(16).fill(0);
    active.forEach((l, i) => {
      opacities[i] = l.opacity;
      blendModes[i] = l.mode === BlendMode.multiply ? 1 : 0;
    });

    this.gl.uniform1fv(this.uOpacitiesLoc, opacities);
    this.gl.uniform1iv(this.uBlendModesLoc, blendModes);
    this.gl.uniform1i(this.uActiveCountLoc, active.length);
  }

  private renderLoop() {
    const gl = this.gl;
    const loop = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  destroy(skipOnHotReload = false) {
    if (skipOnHotReload && (import.meta as any).hot) return;
    cancelAnimationFrame(this.animationId);
    this.textureMgr.dispose();
    deleteProgramSafe(this.gl, this.program);
  }

  /**
   * 現在のキャンバス合成結果を縮小コピーして
   * PNG Blob を返す
   */
  async exportThumbnailPng(thumbW: number, thumbH: number): Promise<Blob> {
    // GPUコマンドを同期完了させる
    this.gl.flush();
    this.gl.finish();

    console.log(
      'src backing:',
      this.canvas.width,
      this.canvas.height,
      'src css:',
      this.canvas.style.width,
      this.canvas.style.height
    );

    const thumb = document.createElement('canvas');
    thumb.width = thumbW;
    thumb.height = thumbH;
    const ctx = thumb.getContext('2d')!;
    ctx.drawImage(this.canvas, 0, 0, thumbW, thumbH);
    return await new Promise<Blob>((r) => thumb.toBlob((b) => r(b!)));
  }

  /**
   * ImageData が欲しい場合はこちら
   */
  getThumbnailImageData(thumbW: number, thumbH: number): ImageData {
    const thumb = document.createElement('canvas');
    thumb.width = thumbW;
    thumb.height = thumbH;
    const ctx = thumb.getContext('2d')!;
    ctx.drawImage(this.canvas, 0, 0, thumbW, thumbH);
    return ctx.getImageData(0, 0, thumbW, thumbH);
  }
}

export async function exportThumbnailDataURL(
  controller: WebGLCanvasController,
  thumbW: number,
  thumbH: number
): Promise<string> {
  const blob = await controller.exportThumbnailPng(thumbW, thumbH);
  return await blobToDataURL(blob);
}
