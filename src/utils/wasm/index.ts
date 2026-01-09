import type { RawPixelData } from '@sledge-pdm/core';
import { rawToWebp as wasmRawToWebp, webpToRaw as wasmWebpToRaw } from '@sledge-pdm/core';
import * as wasm from '@sledge/wasm';
import * as js from '~/utils/wasm_js';

export type WasmImplementationKind = 'wasm' | 'js';

export interface WasmImplementation {
  rawToWebp: (buffer: RawPixelData, width: number, height: number) => Uint8Array;
  webpToRaw: (buffer: Uint8Array, width: number, height: number) => Uint8Array;
  flip_pixels_vertically: (pixels: Uint8Array, width: number, height: number) => void;
  create_opacity_mask: (buffer: Uint8Array, width: number, height: number) => Uint8Array;
  auto_select_region_mask: (
    buffer: Uint8Array,
    width: number,
    height: number,
    start_x: number,
    start_y: number,
    threshold: number,
    _connectivity: number
  ) => Uint8Array;
  fill_mask_area: (
    buffer: Uint8Array,
    mask: Uint8Array,
    fill_color_r: number,
    fill_color_g: number,
    fill_color_b: number,
    fill_color_a: number
  ) => boolean;
  scanline_flood_fill: (
    buffer: Uint8Array,
    width: number,
    height: number,
    start_x: number,
    start_y: number,
    fill_color_r: number,
    fill_color_g: number,
    fill_color_b: number,
    fill_color_a: number,
    threshold: number
  ) => boolean;
  scanline_flood_fill_with_mask: (
    buffer: Uint8Array,
    width: number,
    height: number,
    start_x: number,
    start_y: number,
    fill_color_r: number,
    fill_color_g: number,
    fill_color_b: number,
    fill_color_a: number,
    threshold: number,
    selection_mask: Uint8Array,
    limit_mode: string
  ) => boolean;
  combine_masks_add: (base_mask: Uint8Array, preview_mask: Uint8Array) => Uint8Array;
  combine_masks_subtract: (base_mask: Uint8Array, preview_mask: Uint8Array) => Uint8Array;
  combine_masks_replace: (preview_mask: Uint8Array) => Uint8Array;
  fill_rect_mask: (
    mask: Uint8Array,
    width: number,
    height: number,
    start_x: number,
    start_y: number,
    rect_width: number,
    rect_height: number
  ) => void;
  apply_mask_offset: (mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number) => Uint8Array;
  trim_mask_with_box: (
    mask: Uint8Array,
    mask_width: number,
    mask_height: number,
    box_x: number,
    box_y: number,
    box_width: number,
    box_height: number
  ) => Uint8Array;
  fill_lasso_selection: (mask: Uint8Array, width: number, height: number, points: Float32Array, fill_rule: string) => boolean;
  mask_to_path: (mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number) => string;
}

const wasmImpl: WasmImplementation = {
  ...wasm,
  rawToWebp: wasmRawToWebp,
  webpToRaw: wasmWebpToRaw,
};

const jsImpl: WasmImplementation = js;

const envKind = import.meta.env?.VITE_WASM_IMPL;
const defaultImpl = envKind === 'wasm' ? wasmImpl : jsImpl;

let impl: WasmImplementation = defaultImpl;

export const setWasmImplementation = (next: WasmImplementationKind | WasmImplementation) => {
  if (next === 'wasm') {
    impl = wasmImpl;
    return;
  }
  if (next === 'js') {
    impl = jsImpl;
    return;
  }
  impl = next;
};

export const resetWasmImplementation = () => {
  impl = defaultImpl;
};

const getImpl = () => impl;

export const rawToWebp = (...args: Parameters<WasmImplementation['rawToWebp']>) => getImpl().rawToWebp(...args);
export const webpToRaw = (...args: Parameters<WasmImplementation['webpToRaw']>) => getImpl().webpToRaw(...args);
export const flip_pixels_vertically = (...args: Parameters<WasmImplementation['flip_pixels_vertically']>) =>
  getImpl().flip_pixels_vertically(...args);
export const create_opacity_mask = (...args: Parameters<WasmImplementation['create_opacity_mask']>) => getImpl().create_opacity_mask(...args);
export const auto_select_region_mask = (...args: Parameters<WasmImplementation['auto_select_region_mask']>) =>
  getImpl().auto_select_region_mask(...args);
export const fill_mask_area = (...args: Parameters<WasmImplementation['fill_mask_area']>) => getImpl().fill_mask_area(...args);
export const scanline_flood_fill = (...args: Parameters<WasmImplementation['scanline_flood_fill']>) => getImpl().scanline_flood_fill(...args);
export const scanline_flood_fill_with_mask = (...args: Parameters<WasmImplementation['scanline_flood_fill_with_mask']>) =>
  getImpl().scanline_flood_fill_with_mask(...args);
export const combine_masks_add = (...args: Parameters<WasmImplementation['combine_masks_add']>) => getImpl().combine_masks_add(...args);
export const combine_masks_subtract = (...args: Parameters<WasmImplementation['combine_masks_subtract']>) =>
  getImpl().combine_masks_subtract(...args);
export const combine_masks_replace = (...args: Parameters<WasmImplementation['combine_masks_replace']>) => getImpl().combine_masks_replace(...args);
export const fill_rect_mask = (...args: Parameters<WasmImplementation['fill_rect_mask']>) => getImpl().fill_rect_mask(...args);
export const apply_mask_offset = (...args: Parameters<WasmImplementation['apply_mask_offset']>) => getImpl().apply_mask_offset(...args);
export const trim_mask_with_box = (...args: Parameters<WasmImplementation['trim_mask_with_box']>) => getImpl().trim_mask_with_box(...args);
export const fill_lasso_selection = (...args: Parameters<WasmImplementation['fill_lasso_selection']>) => getImpl().fill_lasso_selection(...args);
export const mask_to_path = (...args: Parameters<WasmImplementation['mask_to_path']>) => getImpl().mask_to_path(...args);
