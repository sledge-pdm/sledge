use wasm_bindgen::prelude::*;

// RGBAピクセルバッファから不透明部分のマスクを作成
#[wasm_bindgen]
pub fn create_opacity_mask(buffer: &[u8], width: u32, height: u32) -> Vec<u8> {
    let total_pixels = (width * height) as usize;
    let mut mask = vec![0u8; total_pixels];

    for y in 0..height {
        for x in 0..width {
            let index = ((y * width + x) * 4 + 3) as usize; // アルファチャンネル
            let mask_index = (y * width + x) as usize;

            if index < buffer.len() && mask_index < mask.len() {
                mask[mask_index] = if buffer[index] > 0 { 1 } else { 0 };
            }
        }
    }

    mask
}
