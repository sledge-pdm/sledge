import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { BlendMode, getLayerIndex, Layer } from '~/features/layer';
import { flushPatch, getBufferCopy, registerWholeChange, setBuffer } from '~/features/layer/anvil/AnvilController';
import { canvasStore, setLayerListStore } from '~/stores/ProjectStores';
import { WebGLRenderer } from '~/webgl/WebGLRenderer';

export interface LayerMergeParams {
  originLayer: Layer;
  targetLayer: Layer;
}

let mergeCanvas: HTMLCanvasElement | null = null;
let mergeRenderer: WebGLRenderer | null = null;

function ensureMergeRenderer(originLayer: Layer, targetLayer: Layer): WebGLRenderer {
  const { width, height } = canvasStore.canvas;
  if (!mergeCanvas) mergeCanvas = document.createElement('canvas');
  mergeCanvas.width = width;
  mergeCanvas.height = height;
  mergeCanvas.style.width = `${width}px`;
  mergeCanvas.style.height = `${height}px`;
  if (!mergeRenderer) {
    mergeRenderer = new WebGLRenderer(mergeCanvas, width, height, [originLayer, targetLayer]);
  } else {
    mergeRenderer.setLayers([originLayer, targetLayer]);
    mergeRenderer.resize(width, height);
  }
  mergeRenderer.setIncludeBaseLayer(false);
  return mergeRenderer;
}

export async function mergeLayer({ originLayer, targetLayer }: LayerMergeParams): Promise<void> {
  // Anvil 層が存在する前提 (存在しない場合は何もしない)
  const before = getBufferCopy(targetLayer.id);
  if (!before) return;

  // インデックスの確認
  const tIdx = getLayerIndex(targetLayer.id);
  const oIdx = getLayerIndex(originLayer.id);
  if (tIdx < 0 || oIdx < 0) return;

  // WebGL で2パス描画
  const renderer = ensureMergeRenderer(originLayer, targetLayer);
  const out = renderer.readPixelsFlipped();

  // whole diff 登録 & 履歴 (swap method)
  setBuffer(targetLayer.id, out);
  registerWholeChange(targetLayer.id, before);
  const patch = flushPatch(targetLayer.id);
  if (patch) projectHistoryController.addAction(new AnvilLayerHistoryAction(targetLayer.id, patch, { tool: 'merge' }));

  // target を normal / 100% に正規化
  if (tIdx >= 0) {
    setLayerListStore('layers', tIdx, 'mode', BlendMode.normal);
    setLayerListStore('layers', tIdx, 'opacity', 1.0);
  }
}
