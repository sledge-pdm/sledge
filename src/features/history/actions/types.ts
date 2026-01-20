import type { Layer } from '~/features/layer';

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
