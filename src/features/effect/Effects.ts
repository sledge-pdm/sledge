import type { Layer } from '@sledge-pdm/frasco';
import { refuseIfExclusiveEditSession } from '~/features/edit_session';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { updateFrascoCanvas } from '~/webgl/service';

export type LayerEffectMutator = (layer: Layer) => void;

export function applyEffect(layerId: string | undefined, fxName: string, mutator: LayerEffectMutator) {
  if (!layerId) return;
  // every effect panel's Apply reaches the layer through here, and a move floating over that layer is
  // holding the pixels this would rewrite - its commit would put the pre-effect ones back.
  if (refuseIfExclusiveEditSession(`applying ${fxName}`)) return;
  const layer = layerManager.getLayerOptional(layerId);
  if (!layer) return;

  mutator(layer);

  updateFrascoCanvas(`Apply FX for ${layerId}`);
}
