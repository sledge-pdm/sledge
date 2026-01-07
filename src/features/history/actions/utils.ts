import { LayerSnapshot } from '~/features/history/actions/types';
import { findLayerById } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';

export function getLayerSnapshot(layerId: string): LayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const frascoLayer = layerManager.getLayerOptional(layerId);
  if (!frascoLayer) return;
  const buffer = frascoLayer.exportRaw();
  return {
    layer: { ...layer },
    image: {
      buffer: new Uint8ClampedArray(buffer),
      width: frascoLayer.getWidth(),
      height: frascoLayer.getHeight(),
    },
  };
}
