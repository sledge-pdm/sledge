import { PackedLayerSnapshot } from '~/features/history/actions/types';
import { findLayerById } from '~/features/layer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';

export function getPackedLayerSnapshot(layerId: string): PackedLayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const anvil = getAnvil(layerId);

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
