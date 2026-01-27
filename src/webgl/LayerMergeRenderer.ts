import { BlendMode } from '@sledge-pdm/frasco';
import { frascoRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { historyManager } from '~/features/history';
import { LayerMergeCommand } from '~/features/history/command/layer/LayerMergeCommand';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { activeLayer, getLayerIndex, Layer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { FrascoRenderer } from '~/webgl/FrascoRenderer';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

class LayerMergeRenderer {
  constructor(
    private originLayer: Layer,
    private targetLayer: Layer
  ) {}

  private getRenderer(): FrascoRenderer | undefined {
    return frascoRenderer;
  }

  async mergeLayer(): Promise<void> {
    const tIdx = getLayerIndex(this.targetLayer.id);
    const oIdx = getLayerIndex(this.originLayer.id);
    if (tIdx < 0 || oIdx < 0) return;

    const command = new LayerMergeCommand({ originIndex: oIdx, targetIndex: tIdx, activeLayerId: activeLayer().id });

    const renderer = this.getRenderer();
    if (!renderer) return;

    const prevIncludeBaseLayer = renderer.getIncludeBaseLayer();
    renderer.setIncludeBaseLayer(false);
    const out = renderer.renderLayersImmediate([this.originLayer, this.targetLayer]);
    renderer.setIncludeBaseLayer(prevIncludeBaseLayer);
    const targetLayer = layerManager.getLayerOptional(this.targetLayer.id);
    if (!targetLayer) return;
    targetLayer.writePixels(out);

    setProjectStore('layers', 'layers', tIdx, 'mode', BlendMode.normal);
    setProjectStore('layers', 'layers', tIdx, 'opacity', 1.0);

    setProjectStore('layers', 'layers', oIdx, 'enabled', false);
    if (projectStore.layers.state.activeLayerId === this.originLayer.id) {
      setProjectStore('layers', 'state', 'activeLayerId', this.targetLayer.id);
    }

    updateWebGLCanvas('Layer merge');
    updateLayerPreview(this.targetLayer.id);
    updateLayerPreview(this.originLayer.id);

    historyManager.addEntry(new CommandsHistoryEntry(command));
  }
}

export default LayerMergeRenderer;
