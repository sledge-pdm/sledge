import { gzipDeflate, gzipInflate, Layer } from '@sledge-pdm/core';
import { findLayerById } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';

export interface LayerSnapshot {
  layer: Layer;
  image?: {
    buffer: Uint8ClampedArray;
    width: number;
    height: number;
  };
}

// Present Layer snapshot format
export interface PackedLayerSnapshot {
  layer: Layer;
  image?: {
    packedBuffer: Uint8Array;
    width: number;
    height: number;
  };
}

export function getPackedLayerSnapshot(layerId: string): PackedLayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const frascoLayer = layerManager.getLayerOptional(layerId);
  if (!frascoLayer) return;
  const buffer = frascoLayer.readPixels();
  return {
    layer: { ...layer },
    image: {
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

  return undefined;
}
