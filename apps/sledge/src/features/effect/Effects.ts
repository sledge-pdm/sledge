import type { RgbaBuffer } from '@sledge/anvil';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { flushPatch } from '~/features/layer/anvil/AnvilController';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export type LayerEffectMutator = (buffer: RgbaBuffer) => void;

export function applyEffect(layerId: string | undefined, fxName: string, mutator: LayerEffectMutator) {
  if (!layerId) return;
  const anvil = getAnvil(layerId);

  anvil.applyWholeBufferEffect(mutator);

  const patch = flushPatch(layerId);
  if (patch) {
    projectHistoryController.addAction(new AnvilLayerHistoryAction({ layerId, patch, context: { tool: 'fx', fxName } }));
  }

  updateWebGLCanvas(false, `Apply FX for ${layerId}`);
  updateLayerPreview(layerId);
}
