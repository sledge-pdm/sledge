import { PackedLayerSnapshot } from '~/features/history/actions/types';
import { findLayerById } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';

export function getPackedLayerSnapshot(layerId: string): PackedLayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  const anvil = getAnvilOf(layerId);
  if (!layer || !anvil) return;

  const webpBuffer = anvil.exportWebp();
  return {
    layer,
    image: {
      webpBuffer,
      width: anvil.getWidth(),
      height: anvil.getHeight(),
    },
  };
}
