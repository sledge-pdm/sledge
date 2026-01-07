import type { Layer } from '@sledge-pdm/frasco';
import { projectHistoryController } from '~/features/history';
import { LayerHistoryAction } from '~/features/history/actions/LayerHistoryAction';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export type LayerEffectMutator = (layer: Layer) => void;

export function applyEffect(layerId: string | undefined, fxName: string, mutator: LayerEffectMutator) {
  if (!layerId) return;
  const layer = layerManager.getLayerOptional(layerId);
  if (!layer) return;

  mutator(layer);
  projectHistoryController.addAction(new LayerHistoryAction({ layerId, context: { tool: 'fx', fxName } }));

  updateWebGLCanvas(false, `Apply FX for ${layerId}`);
  updateLayerPreview(layerId);
}
