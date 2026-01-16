import { RawPixelData } from '@sledge-pdm/core';
import { SurfaceBounds } from '@sledge-pdm/frasco';

export function createTexture(gl: WebGL2RenderingContext, width: number, height: number, data?: RawPixelData): WebGLTexture {
  if (data) {
    const expected = width * height * 4;
    if (data.length !== expected) {
      throw new Error(`createTexture: buffer length ${data.length} !== expected ${expected}`);
    }
  }
  const tex = gl.createTexture();
  if (!tex) throw new Error('Layer: failed to create texture');

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data ?? null);
  return tex;
}

export function deleteTexture(gl: WebGL2RenderingContext, texture: WebGLTexture) {
  gl.deleteTexture(texture);
}

export function readTexturePixels(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  bounds: SurfaceBounds,
  framebuffer?: WebGLFramebuffer
): Uint8Array {
  const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  const fbo = framebuffer ?? gl.createFramebuffer();
  if (!fbo) throw new Error('readTexturePixels: failed to create framebuffer');

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
  const out = new Uint8Array(bounds.width * bounds.height * 4);
  gl.readPixels(bounds.x, bounds.y, bounds.width, bounds.height, gl.RGBA, gl.UNSIGNED_BYTE, out);

  gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
  if (!framebuffer) gl.deleteFramebuffer(fbo);
  return out;
}
