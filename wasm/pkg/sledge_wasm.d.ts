/* tslint:disable */
/* eslint-disable */

/**
 * マスクオフセット適用（commitOffset用）
 */
export function apply_mask_offset(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): Uint8Array;

/**
 * しきい値付きの自動選択（領域抽出）
 * 入力バッファは RGBA 連続の &[u8]。変更せず、選択マスク(幅*高さ, 0/1)を返す。
 */
export function auto_select_region_mask(buffer: Uint8Array, width: number, height: number, start_x: number, start_y: number, threshold: number, _connectivity: number): Uint8Array;

/**
 * マスク合成：OR演算 (add mode)
 */
export function combine_masks_add(base_mask: Uint8Array, preview_mask: Uint8Array): Uint8Array;

/**
 * マスク合成：置換 (replace mode)
 */
export function combine_masks_replace(preview_mask: Uint8Array): Uint8Array;

/**
 * マスク合成：AND NOT演算 (subtract mode)
 */
export function combine_masks_subtract(base_mask: Uint8Array, preview_mask: Uint8Array): Uint8Array;

export function create_opacity_mask(buffer: Uint8Array, width: number, height: number): Uint8Array;

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

export function fill_mask_area(buffer: Uint8Array, mask: Uint8Array, fill_color_r: number, fill_color_g: number, fill_color_b: number, fill_color_a: number): boolean;

/**
 * 矩形をマスクに描画
 */
export function fill_rect_mask(mask: Uint8Array, width: number, height: number, start_x: number, start_y: number, rect_width: number, rect_height: number): void;

/**
 * ピクセルデータを上下反転する関数
 * WebGLのreadPixelsは下から上の順序で返すため、通常の画像として使う場合は反転が必要
 */
export function flip_pixels_vertically(pixels: Uint8Array, width: number, height: number): void;

/**
 * 選択範囲マスクからSVGパス文字列を生成
 */
export function mask_to_path(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): string;

/**
 * スキャンライン方式のFloodFill実装
 *
 * この実装は以下の特徴を持ちます：
 * - メモリ効率的なスキャンライン方式
 * - スタックオーバーフロー回避
 * - 高速な隣接色判定
 * - 選択範囲制限サポート
 */
export function scanline_flood_fill(buffer: Uint8Array, width: number, height: number, start_x: number, start_y: number, fill_color_r: number, fill_color_g: number, fill_color_b: number, fill_color_a: number, threshold: number): boolean;

/**
 * 選択範囲制限付きスキャンライン FloodFill
 */
export function scanline_flood_fill_with_mask(buffer: Uint8Array, width: number, height: number, start_x: number, start_y: number, fill_color_r: number, fill_color_g: number, fill_color_b: number, fill_color_a: number, threshold: number, selection_mask: Uint8Array, limit_mode: string): boolean;

export function trim_mask_with_box(mask: Uint8Array, mask_width: number, mask_height: number, box_x: number, box_y: number, box_width: number, box_height: number): Uint8Array;
