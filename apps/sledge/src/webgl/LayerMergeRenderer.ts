import { projectHistoryController } from '~/features/history';
import { LayerMergeHistoryAction } from '~/features/history/actions/LayerMergeHistoryAction';
import { activeLayer, BlendMode, getLayerIndex, Layer } from '~/features/layer';
import { flushPatch, setBuffer } from '~/features/layer/anvil/AnvilController';
import { canvasStore, layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { WebGLRenderer } from '~/webgl/WebGLRenderer';

class LayerMergeRenderer {
  constructor(
    private originLayer: Layer,
    private targetLayer: Layer
  ) {}

  mergeCanvas: HTMLCanvasElement | undefined = undefined;
  mergeRenderer: WebGLRenderer | undefined = undefined;

  createRenderer(): WebGLRenderer {
    const { width, height } = canvasStore.canvas;
    if (!this.mergeCanvas) this.mergeCanvas = document.createElement('canvas');
    this.mergeCanvas.width = width;
    this.mergeCanvas.height = height;
    this.mergeCanvas.style.width = `${width}px`;
    this.mergeCanvas.style.height = `${height}px`;
    if (!this.mergeRenderer) {
      this.mergeRenderer = new WebGLRenderer(this.mergeCanvas, width, height, [this.originLayer, this.targetLayer]);
    } else {
      this.mergeRenderer.setLayers([this.originLayer, this.targetLayer]);
      this.mergeRenderer.resize(width, height);
    }
    this.mergeRenderer.setIncludeBaseLayer(false);

    return this.mergeRenderer;
  }

  async mergeLayer(): Promise<void> {
    // インデックスの確認
    const tIdx = getLayerIndex(this.targetLayer.id);
    const oIdx = getLayerIndex(this.originLayer.id);
    if (tIdx < 0 || oIdx < 0) return;

    const action = new LayerMergeHistoryAction({ originIndex: oIdx, targetIndex: tIdx, activeLayerId: activeLayer().id });

    // WebGL で2パス描画
    const out = this.createRenderer().readPixelsFlipped();
    setBuffer(this.targetLayer.id, out);
    flushPatch(this.targetLayer.id);
    // target を normal / 100% に正規化
    setLayerListStore('layers', tIdx, 'mode', BlendMode.normal);
    setLayerListStore('layers', tIdx, 'opacity', 1.0);

    // disable origin layer
    // note that this may change the behavior to just removing layer.
    setLayerListStore('layers', oIdx, 'enabled', false);
    // set target to active if origin was active
    if (layerListStore.activeLayerId === this.originLayer.id) {
      setLayerListStore('activeLayerId', this.targetLayer.id);
    }

    projectHistoryController.addAction(action);
  }

  releaseRenderer() {
    this.mergeCanvas = undefined;
    if (this.mergeRenderer && typeof this.mergeRenderer.dispose === 'function') {
      this.mergeRenderer.dispose();
    }
    this.mergeRenderer = undefined;
  }
}

export default LayerMergeRenderer;
