use wasm_bindgen::prelude::*;

/// 選択範囲制限モードに応じてピクセルバッファをフィルタリングする
/// original_buffer: 元のピクセルバッファ (RGBA)
/// selection_mask: 選択範囲のマスク (0 or 1)
/// mode: 制限モード ("inside", "outside", "none")
/// width, height: 画像のサイズ
///
/// "inside": 選択範囲外を透明化
/// "outside": 選択範囲内を透明化
/// "none": 元のバッファをそのまま返す
#[wasm_bindgen]
pub fn filter_by_selection_mask(
    original_buffer: &[u8],
    selection_mask: &[u8],
    mode: &str,
    width: u32,
    height: u32,
) -> Vec<u8> {
    let w = width as i32;
    let h = height as i32;

    // 制限なしの場合は元のバッファをそのまま返す
    if mode == "none" {
        return original_buffer.to_vec();
    }

    // 結果バッファを初期化（元のバッファをコピー）
    let mut result = original_buffer.to_vec();

    // 各ピクセルをチェック
    for y in 0..h {
        for x in 0..w {
            let idx = (y * w + x) as usize;

            if idx < selection_mask.len() {
                let is_selected = selection_mask[idx] == 1;
                let should_make_transparent = match mode {
                    "inside" => !is_selected, // 選択範囲外を透明化
                    "outside" => is_selected, // 選択範囲内を透明化
                    _ => false,               // "none"やその他の場合
                };

                if should_make_transparent {
                    let pixel_start = idx * 4;
                    if pixel_start + 3 < result.len() {
                        // ピクセルを透明化
                        result[pixel_start] = 0; // R
                        result[pixel_start + 1] = 0; // G
                        result[pixel_start + 2] = 0; // B
                        result[pixel_start + 3] = 0; // A (完全透明)
                    }
                }
            }
        }
    }

    result
}

/// 2つのバッファを合成する（FloodFill結果を元のバッファに適用）
/// base_buffer: ベースとなるピクセルバッファ (RGBA)
/// overlay_buffer: 重ねるピクセルバッファ (RGBA) - FloodFillの結果
/// selection_mask: 選択範囲のマスク (0 or 1)
/// mode: 制限モード ("inside", "outside", "none")
/// width, height: 画像のサイズ
#[wasm_bindgen]
pub fn composite_fill_result(
    base_buffer: &[u8],
    overlay_buffer: &[u8],
    selection_mask: &[u8],
    mode: &str,
    width: u32,
    height: u32,
) -> Vec<u8> {
    let w = width as i32;
    let h = height as i32;

    // 制限なしの場合はoverlayをそのまま返す
    if mode == "none" {
        return overlay_buffer.to_vec();
    }

    // 結果バッファを初期化（ベースバッファをコピー）
    let mut result = base_buffer.to_vec();

    // 各ピクセルをチェック
    for y in 0..h {
        for x in 0..w {
            let idx = (y * w + x) as usize;

            if idx < selection_mask.len() {
                let is_selected = selection_mask[idx] == 1;
                let should_apply = match mode {
                    "inside" => is_selected,   // 選択範囲内のみ適用
                    "outside" => !is_selected, // 選択範囲外のみ適用
                    _ => true,                 // "none"やその他の場合は全て適用
                };

                if should_apply {
                    let pixel_start = idx * 4;
                    if pixel_start + 3 < overlay_buffer.len() && pixel_start + 3 < result.len() {
                        // overlayのピクセルが透明でない場合のみ適用
                        let overlay_alpha = overlay_buffer[pixel_start + 3];
                        if overlay_alpha > 0 {
                            result[pixel_start] = overlay_buffer[pixel_start];
                            result[pixel_start + 1] = overlay_buffer[pixel_start + 1];
                            result[pixel_start + 2] = overlay_buffer[pixel_start + 2];
                            result[pixel_start + 3] = overlay_buffer[pixel_start + 3];
                        }
                    }
                }
            }
        }
    }

    result
}

#[wasm_bindgen]
pub fn trim_mask_with_box(
    mask: &[u8],
    mask_width: u32,
    mask_height: u32,
    box_x: u32,
    box_y: u32,
    box_width: u32,
    box_height: u32,
) -> Vec<u8> {
    let mw = mask_width as i32;
    let mh = mask_height as i32;
    let bw = box_width as i32;
    let bh = box_height as i32;

    // Output mask has same dims as box
    let mut result = vec![0u8; (box_width as usize) * (box_height as usize)];

    // Offsets
    let ox = box_x as i32;
    let oy = box_y as i32;

    for y in 0..bh {
        for x in 0..bw {
            let bi = (y * bw + x) as usize; // bbox index (1 byte/pixel)
            let src_x = ox + x;
            let src_y = oy + y;
            let si = (src_y * mw + src_x) as usize;

            result[bi] = mask[si];
        }
    }

    result
}