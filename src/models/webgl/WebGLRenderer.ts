import { allLayers } from '~/controllers/layer_list/LayerListController';
import { WebGLCanvasController } from '~/controllers/webgl/WebGLCanvasController';

let renderer: WebGLCanvasController | null = null;

export function initWebglRenderer(canvas: HTMLCanvasElement, maxLayers = 16) {
  renderer = new WebGLCanvasController(canvas, maxLayers);
  renderer.init(allLayers());
  import.meta.hot?.on('vite:afterUpdate', () => {
    if (renderer) renderer.init(allLayers());
  });
  return renderer;
}

export function getWebglRenderer(): WebGLCanvasController {
  if (!renderer) throw new Error('WebGL renderer not initialized yet!');
  return renderer;
}
