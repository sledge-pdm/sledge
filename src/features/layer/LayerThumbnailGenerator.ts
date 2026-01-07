import { flip_pixels_vertically } from '@sledge/wasm';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';

export class LayerThumbnailGenerator {
  private gl: WebGL2RenderingContext | undefined;
  private readFbo: WebGLFramebuffer | null = null;
  private drawFbo: WebGLFramebuffer | null = null;
  private targetTex: WebGLTexture | null = null;
  private thumbnailWidth = 1;
  private thumbnailHeight = 1;
  private pixelBuffer: Uint8Array = new Uint8Array(4);

  constructor() {
    // resources are lazily created when GL is available
  }

  generateLayerThumbnail(layerId: string, width: number, height: number): ImageData {
    try {
      const layer = layerManager.getLayerOptional(layerId);
      const gl = this.ensureContext();
      if (!layer || !gl) {
        return new ImageData(Math.max(width, 1), Math.max(height, 1));
      }

      const sourceWidth = layer.getWidth();
      const sourceHeight = layer.getHeight();
      if (sourceWidth === 0 || sourceHeight === 0 || width === 0 || height === 0) {
        return new ImageData(Math.max(width, 1), Math.max(height, 1));
      }

      this.ensureTarget(width, height);
      if (!this.readFbo || !this.drawFbo || !this.targetTex) {
        return new ImageData(Math.max(width, 1), Math.max(height, 1));
      }

      const prevRead = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
      const prevDraw = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.readFbo);
      gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, layer.getTextureHandle(), 0);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.drawFbo);
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.targetTex, 0);

      gl.blitFramebuffer(0, 0, sourceWidth, sourceHeight, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.drawFbo);
      gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixelBuffer);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, prevRead);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, prevDraw);

      flip_pixels_vertically(this.pixelBuffer, width, height);
      return new ImageData(new Uint8ClampedArray(this.pixelBuffer), width, height);
    } catch (err) {
      // Suppress thumbnail generation errors; return a transparent fallback ImageData
      // (avoid escalating as a critical error for thumbnail generation)
      logSystemWarn('LayerThumbnailGenerator.generateLayerThumbnail suppressed error.', {
        label: 'LayerThumbnailGenerator',
        details: [err],
      });
      return new ImageData(width || 1, height || 1);
    }
  }

  private ensureContext(): WebGL2RenderingContext | undefined {
    try {
      const gl = layerManager.getContext();
      if (this.gl !== gl) {
        this.gl = gl;
        this.disposeResources();
      }
      return gl;
    } catch {
      return undefined;
    }
  }

  private ensureTarget(width: number, height: number): void {
    const gl = this.gl;
    if (!gl) return;

    if (!this.readFbo) {
      this.readFbo = gl.createFramebuffer();
    }
    if (!this.drawFbo) {
      this.drawFbo = gl.createFramebuffer();
    }

    if (!this.targetTex || this.thumbnailWidth !== width || this.thumbnailHeight !== height) {
      if (this.targetTex) {
        gl.deleteTexture(this.targetTex);
      }
      const tex = gl.createTexture();
      if (!tex) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      this.targetTex = tex;
      this.thumbnailWidth = width;
      this.thumbnailHeight = height;
      this.pixelBuffer = new Uint8Array(width * height * 4);
    }
  }

  private disposeResources(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.readFbo) gl.deleteFramebuffer(this.readFbo);
    if (this.drawFbo) gl.deleteFramebuffer(this.drawFbo);
    if (this.targetTex) gl.deleteTexture(this.targetTex);
    this.readFbo = null;
    this.drawFbo = null;
    this.targetTex = null;
  }
}
