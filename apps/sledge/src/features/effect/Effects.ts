import { toUint8Array } from '@sledge/anvil';
import { brightness_contrast, dithering, dust_removal, gaussian_blur, grayscale, invert, posterize } from '@sledge/wasm';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { flushPatch, registerWholeChange } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { eventBus } from '~/utils/EventBus';

const EFFECTS = {
  grayscale: grayscale,
  invert: invert,
  gaussian_blur: gaussian_blur,
  brightness_contrast: brightness_contrast,
  dust_removal: dust_removal,
  posterize: posterize,
  dithering: dithering,
};

export function applyEffect(layerId: string, effect: keyof typeof EFFECTS, options?: any) {
  const anvil = getAnvilOf(layerId);
  if (anvil) {
    const bufferPointer = anvil.getBufferPointer();
    if (!bufferPointer) return;
    registerWholeChange(layerId, bufferPointer);
    EFFECTS[effect](toUint8Array(bufferPointer), anvil.getWidth(), anvil.getHeight(), options);

    const patch = flushPatch(layerId);
    if (patch) {
      projectHistoryController.addAction(new AnvilLayerHistoryAction({ layerId, patch, context: { tool: 'fx', fxName: effect } }));
    }
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Apply FX for ${layerId}` });
    eventBus.emit('preview:requestUpdate', { layerId: layerId });
  }
}
