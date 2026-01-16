import { decodeWebp, gzipDeflate, gzipInflate } from '@sledge-pdm/core';
import { LayerSnapshot, PackedLayerSnapshot } from '~/features/history/actions/types';
import { findLayerById } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';

export function getPackedLayerSnapshot(layerId: string): PackedLayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const frascoLayer = layerManager.getLayerOptional(layerId);
  if (!frascoLayer) return;
  const buffer = frascoLayer.readPixels();
  return {
    layer: { ...layer },
    image: {
      codec: 'deflate',
      packedBuffer: gzipDeflate(buffer),
      width: frascoLayer.getWidth(),
      height: frascoLayer.getHeight(),
    },
  };
}

export function inflateLayerSnapshot(snapshot?: PackedLayerSnapshot): LayerSnapshot | undefined {
  if (!snapshot || !snapshot.image) return undefined;

  const width = snapshot.image.width;
  const height = snapshot.image.height;
  const expected = width * height * 4;

  if (snapshot.image.codec === undefined || snapshot.image.codec === 'webp') {
    const raw = decodeWebp(snapshot.image.packedBuffer, width, height);
    const rawBuffer = (raw.length === expected ? raw : new Uint8ClampedArray(expected)) as Uint8ClampedArray<ArrayBuffer>;
    return {
      layer: snapshot.layer,
      image: {
        buffer: rawBuffer,
        width,
        height,
      },
    };
  } else if (snapshot.image.codec === 'deflate') {
    const raw = gzipInflate(snapshot.image.packedBuffer);
    const rawBuffer = (raw.length === expected ? raw : new Uint8ClampedArray(expected)) as Uint8ClampedArray<ArrayBuffer>;
    return {
      layer: snapshot.layer,
      image: {
        buffer: rawBuffer,
        width,
        height,
      },
    };
  }

  return undefined;
}
