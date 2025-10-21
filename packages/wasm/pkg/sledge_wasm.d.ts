/* tslint:disable */
/* eslint-disable */
/**
 * 選択範囲マスクからSVGパス文字列を生成
 */
export function mask_to_path(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): string;
/**
 * Remove small isolated pixel groups (dust removal)
 */
export function dust_removal(pixels: Uint8Array, width: number, height: number, options: DustRemovalOption): void;
/**
 * Remove small isolated pixel groups with default settings
 */
export function dust_removal_simple(pixels: Uint8Array, width: number, height: number, max_size: number): void;
/**
 * 選択範囲制限モードに応じてピクセルバッファをフィルタリングする
 * original_buffer: 元のピクセルバッファ (RGBA)
 * selection_mask: 選択範囲のマスク (0 or 1)
 * mode: 制限モード ("inside", "outside", "none")
 * width, height: 画像のサイズ
 *
 * "inside": 選択範囲外を透明化
 * "outside": 選択範囲内を透明化
 * "none": 元のバッファをそのまま返す
 */
export function filter_by_selection_mask(original_buffer: Uint8Array, selection_mask: Uint8Array, mode: string, width: number, height: number): Uint8Array;
/**
 * 2つのバッファを合成する（FloodFill結果を元のバッファに適用）
 * base_buffer: ベースとなるピクセルバッファ (RGBA)
 * overlay_buffer: 重ねるピクセルバッファ (RGBA) - FloodFillの結果
 * selection_mask: 選択範囲のマスク (0 or 1)
 * mode: 制限モード ("inside", "outside", "none")
 * width, height: 画像のサイズ
 */
export function composite_fill_result(base_buffer: Uint8Array, overlay_buffer: Uint8Array, selection_mask: Uint8Array, mode: string, width: number, height: number): Uint8Array;
export function trim_mask_with_box(mask: Uint8Array, mask_width: number, mask_height: number, box_x: number, box_y: number, box_width: number, box_height: number): Uint8Array;
/**
 * しきい値付きの自動選択（領域抽出）
 * 入力バッファは RGBA 連続の &[u8]。変更せず、選択マスク(幅*高さ, 0/1)を返す。
 */
export function auto_select_region_mask(buffer: Uint8Array, width: number, height: number, start_x: number, start_y: number, threshold: number, _connectivity: number): Uint8Array;
/**
 * ピクセルデータを上下反転する関数
 * WebGLのreadPixelsは下から上の順序で返すため、通常の画像として使う場合は反転が必要
 */
export function flip_pixels_vertically(pixels: Uint8Array, width: number, height: number): void;
/**
 * タイルバッファから指定領域のピクセルデータを抽出する関数
 * WebGLRendererのrender()メソッドで使用される重い処理を最適化
 */
export function extract_tile_buffer(source_buffer: Uint8Array, source_width: number, _source_height: number, tile_x: number, tile_y: number, tile_width: number, tile_height: number): Uint8Array;
/**
 * 複数のピクセルバッファをブレンドする関数（CPUベースの最適化）
 * レイヤーの不透明度とブレンドモードを考慮した合成処理
 */
export function blend_layers(base_buffer: Uint8Array, overlay_buffer: Uint8Array, width: number, height: number, opacity: number, blend_mode: number): void;
/**
 * メモリ使用量を計算するユーティリティ関数
 */
export function calculate_texture_memory_usage(width: number, height: number, layer_count: number): number;
/**
 * マスク合成：OR演算 (add mode)
 */
export function combine_masks_add(base_mask: Uint8Array, preview_mask: Uint8Array): Uint8Array;
/**
 * マスク合成：AND NOT演算 (subtract mode)
 */
export function combine_masks_subtract(base_mask: Uint8Array, preview_mask: Uint8Array): Uint8Array;
/**
 * マスク合成：置換 (replace mode)
 */
export function combine_masks_replace(preview_mask: Uint8Array): Uint8Array;
/**
 * 矩形をマスクに描画
 */
export function fill_rect_mask(mask: Uint8Array, width: number, height: number, start_x: number, start_y: number, rect_width: number, rect_height: number): void;
/**
 * マスクオフセット適用（commitOffset用）
 */
export function apply_mask_offset(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): Uint8Array;
/**
 * Extract RGBA pixels from `source` where `mask` (1 byte per pixel) is zero.
 * - `source`: RGBA buffer (width=source_width, height=source_height)
 * - `mask`: 1 byte per pixel (0 or 1), dimensions `mask_width` x `mask_height`
 * - `mask_offset_x/y`: where to sample from the source for mask(0,0)
 * Returns an RGBA buffer sized `source_width * source_height * 4`, where selected pixels are fully transparent.
 */
export function crop_patch_rgba(source: Uint8Array, source_width: number, source_height: number, mask: Uint8Array, mask_width: number, mask_height: number, mask_offset_x: number, mask_offset_y: number): Uint8Array;
/**
 * Lasso選択のためのスキャンライン塗りつぶし実装
 *
 * この実装は以下の特徴を持ちます：
 * - ポリゴン内部をスキャンライン方式で効率的に判定
 * - Point-in-polygon アルゴリズムによる正確な内部判定
 * - バウンディングボックスによる計算範囲の最適化
 * - メモリ効率的な実装
 * - evenodd/nonzero塗りつぶし規則の選択
 */
export function fill_lasso_selection(mask: Uint8Array, width: number, height: number, points: Float32Array, fill_rule: string): boolean;
/**
 * 選択範囲制限付きLasso選択
 */
export function fill_lasso_selection_with_mask(mask: Uint8Array, width: number, height: number, points: Float32Array, existing_mask: Uint8Array, limit_mode: string): boolean;
/**
 * Point-in-polygon アルゴリズムを使用した直接的な実装（小さなポリゴン用）
 */
export function fill_lasso_selection_point_in_polygon(mask: Uint8Array, width: number, height: number, points: Float32Array): boolean;
export function create_opacity_mask(buffer: Uint8Array, width: number, height: number): Uint8Array;
/**
 * Apply brightness and contrast adjustments to the image
 */
export function brightness_contrast(pixels: Uint8Array, width: number, height: number, options: BrightnessContrastOption): void;
/**
 * Apply only brightness adjustment to the image
 */
export function brightness(pixels: Uint8Array, width: number, height: number, brightness: number): void;
/**
 * Apply only contrast adjustment to the image
 */
export function contrast(pixels: Uint8Array, width: number, height: number, contrast: number): void;
export function grayscale(pixels: Uint8Array, width: number, height: number): void;
export function patch_buffer_rgba(target: Uint8Array, target_width: number, target_height: number, patch: Uint8Array, patch_width: number, patch_height: number, offset_x: number, offset_y: number): Uint8Array;
export function gaussian_blur(pixels: Uint8Array, width: number, height: number, options: GaussianBlurOption): void;
export function invert(pixels: Uint8Array, width: number, height: number): void;
/**
 * Extract RGBA pixels from `source` where `mask` (1 byte per pixel) is non-zero.
 * - `source`: RGBA buffer (width=source_width, height=source_height)
 * - `mask`: 1 byte per pixel (0 or 1), dimensions `mask_width` x `mask_height`
 * - `mask_offset_x/y`: where to sample from the source for mask(0,0)
 * Returns an RGBA buffer sized `mask_width * mask_height * 4`, where non-selected pixels are fully transparent.
 */
export function slice_patch_rgba(source: Uint8Array, source_width: number, source_height: number, mask: Uint8Array, mask_width: number, mask_height: number, mask_offset_x: number, mask_offset_y: number): Uint8Array;
export enum AlphaBlurMode {
  /**
   * Skip alpha channel (preserve original alpha values)
   */
  Skip = 0,
  /**
   * Apply blur to alpha channel as well
   */
  Blur = 1,
}
export class BrightnessContrastOption {
  free(): void;
  [Symbol.dispose](): void;
  constructor(brightness: number, contrast: number);
  /**
   * Brightness adjustment (-100.0 to 100.0, 0.0 = no change)
   */
  brightness: number;
  /**
   * Contrast adjustment (-100.0 to 100.0, 0.0 = no change)  
   */
  contrast: number;
}
export class DustRemovalOption {
  free(): void;
  [Symbol.dispose](): void;
  constructor(max_size: number, alpha_threshold: number);
  /**
   * Maximum size of pixel groups to remove (1-100, groups with this many pixels or fewer will be removed)
   */
  max_size: number;
  /**
   * Minimum alpha threshold to consider a pixel as non-transparent (0-255)
   */
  alpha_threshold: number;
}
export class GaussianBlurOption {
  free(): void;
  [Symbol.dispose](): void;
  constructor(radius: number, alpha_mode: AlphaBlurMode);
  /**
   * Blur radius (higher values create stronger blur effect)
   */
  radius: number;
  /**
   * How to handle the alpha channel
   */
  alpha_mode: AlphaBlurMode;
}
