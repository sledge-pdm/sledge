import { layerManager } from '~/features/layer/frasco/LayerManager';

export type E2EImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type WebGLCanvasHandle = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
};

export type WebGLCanvasOptions = {
  width?: number;
  height?: number;
  appendToBody?: boolean;
  setLayerManagerContext?: boolean;
};

export const createWebGLCanvas = (options: WebGLCanvasOptions = {}): WebGLCanvasHandle => {
  const { width, height, appendToBody = true, setLayerManagerContext = true } = options;
  const canvas = document.createElement('canvas');
  if (width !== undefined) canvas.width = width;
  if (height !== undefined) canvas.height = height;
  if (appendToBody) document.body.appendChild(canvas);
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 is not supported in this browser');
  if (setLayerManagerContext) {
    layerManager.setContext(gl);
  }
  return { canvas, gl };
};

export async function loadImageData(path: URL): Promise<E2EImage> {
  const url = path;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`E2E: failed to load image ${url.href}`);
  }
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('E2E: 2D canvas context not available');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: new Uint8Array(imageData.data), width: canvas.width, height: canvas.height };
}
