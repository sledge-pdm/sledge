import { gaussian_blur, grayscale, invert } from '@sledge/wasm';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { flushPatch, registerWholeChange } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { eventBus } from '~/utils/EventBus';

const EFFECTS = {
  grayscale: grayscale,
  invert: invert,
  gaussian_blur: gaussian_blur,
};

export function applyEffect(layerId: string, effect: keyof typeof EFFECTS, options?: any) {
  const anvil = getAnvilOf(layerId);
  if (anvil) {
    const originalBuffer = anvil.getImageData().slice();
    EFFECTS[effect](new Uint8Array(anvil.getBufferData().buffer), anvil.getWidth(), anvil.getHeight(), options);

    registerWholeChange(layerId, originalBuffer);

    const patch = flushPatch(layerId);
    if (patch) {
      projectHistoryController.addAction(new AnvilLayerHistoryAction(layerId, patch, { tool: 'fx', fxName: effect }));
    }
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Apply FX for ${layerId}` });
    eventBus.emit('preview:requestUpdate', { layerId: layerId });
  }
}
