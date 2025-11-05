use wasm_bindgen::prelude::*;

/// マスク合成：OR演算 (add mode)
#[wasm_bindgen]
pub fn combine_masks_add(base_mask: &[u8], preview_mask: &[u8]) -> Vec<u8> {
    let mut result = base_mask.to_vec();
    for i in 0..result.len().min(preview_mask.len()) {
        result[i] |= preview_mask[i];
    }
    result
}

/// マスク合成：AND NOT演算 (subtract mode)
#[wasm_bindgen]
pub fn combine_masks_subtract(base_mask: &[u8], preview_mask: &[u8]) -> Vec<u8> {
    let mut result = base_mask.to_vec();
    for i in 0..result.len().min(preview_mask.len()) {
        result[i] &= preview_mask[i] ^ 1;
    }
    result
}

/// マスク合成：置換 (replace mode)
#[wasm_bindgen]
pub fn combine_masks_replace(preview_mask: &[u8]) -> Vec<u8> {
    preview_mask.to_vec()
}

/// 矩形をマスクに描画
#[wasm_bindgen]
pub fn fill_rect_mask(
    mask: &mut [u8],
    width: u32,
    height: u32,
    start_x: u32,
    start_y: u32,
    rect_width: u32,
    rect_height: u32,
) {
    let w = width as usize;
    let _h = height as usize;

    for y in start_y..(start_y + rect_height).min(height) {
        for x in start_x..(start_x + rect_width).min(width) {
            let idx = (y as usize) * w + (x as usize);
            if idx < mask.len() {
                mask[idx] = 1;
            }
        }
    }
}

/// マスクオフセット適用（commitOffset用）
#[wasm_bindgen]
pub fn apply_mask_offset(
    mask: &[u8],
    width: u32,
    height: u32,
    offset_x: i32,
    offset_y: i32,
) -> Vec<u8> {
    let w = width as i32;
    let h = height as i32;
    let mut result = vec![0u8; (width * height) as usize];

    for y in 0..h {
        for x in 0..w {
            let old_idx = (y * w + x) as usize;
            if old_idx < mask.len() && mask[old_idx] == 1 {
                let new_x = x + offset_x;
                let new_y = y + offset_y;

                if new_x >= 0 && new_x < w && new_y >= 0 && new_y < h {
                    let new_idx = (new_y * w + new_x) as usize;
                    if new_idx < result.len() {
                        result[new_idx] = 1;
                    }
                }
            }
        }
    }

    result
}
