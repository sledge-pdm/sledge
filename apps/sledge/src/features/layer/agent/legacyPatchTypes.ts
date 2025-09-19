// Local legacy layer buffer patch types & helpers (extracted from deleted history action)
import type { RGBAColor } from '~/features/color';
import type { TileIndex } from './managers/Tile';

export type PackedRGBA = number;
export const packRGBA = (c: RGBAColor): PackedRGBA => (c[3] << 24) | (c[0] << 16) | (c[1] << 8) | c[2];
export const unpackRGBA = (p: PackedRGBA): RGBAColor => [(p >> 16) & 0xff, (p >> 8) & 0xff, p & 0xff, (p >>> 24) & 0xff];

export type PixelListPatch = {
  type: 'pixels';
  tile: TileIndex;
  idx: Uint16Array;
  before: Uint32Array;
  after: Uint32Array;
};

export type TileFillPatch = {
  type: 'tileFill';
  tile: TileIndex;
  before?: PackedRGBA;
  after: PackedRGBA;
};

export type WholePatch = {
  type: 'whole';
  before: Uint8ClampedArray;
  after: Uint8ClampedArray;
};

export type LayerBufferPatch = {
  layerId: string;
  pixels?: PixelListPatch[];
  tiles?: TileFillPatch[];
  whole?: WholePatch;
};
