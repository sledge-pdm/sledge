import type { Layer } from '@sledge-pdm/frasco';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { updateFrascoCanvas } from '~/webgl/service';

export type LayerEffectMutator = (layer: Layer) => void;

export function applyEffect(layerId: string | undefined, fxName: string, mutator: LayerEffectMutator) {
  if (!layerId) return;
  const layer = layerManager.getLayerOptional(layerId);
  if (!layer) return;

  mutator(layer);

  updateFrascoCanvas(`Apply FX for ${layerId}`);
}
