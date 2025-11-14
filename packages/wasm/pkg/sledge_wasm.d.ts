/* tslint:disable */
/* eslint-disable */
/**
 * 選択範囲マスクからSVGパス文字列を生成
 */
export function mask_to_path(mask: Uint8Array, width: number, height: number, offset_x: number, offset_y: number): string;
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
 * ピクセルデータを上下反転する関数
 * WebGLのreadPixelsは下から上の順序で返すため、通常の画像として使う場合は反転が必要
 */
export function flip_pixels_vertically(pixels: Uint8Array, width: number, height: number): void;
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
export function create_opacity_mask(buffer: Uint8Array, width: number, height: number): Uint8Array;
/**
 * しきい値付きの自動選択（領域抽出）
 * 入力バッファは RGBA 連続の &[u8]。変更せず、選択マスク(幅*高さ, 0/1)を返す。
 */
export function auto_select_region_mask(buffer: Uint8Array, width: number, height: number, start_x: number, start_y: number, threshold: number, _connectivity: number): Uint8Array;
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
