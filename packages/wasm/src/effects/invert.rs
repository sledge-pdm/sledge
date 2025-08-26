use wasm_bindgen::prelude::*;

use crate::console_log;

// invert image
#[wasm_bindgen]
pub fn invert(pixels: &mut [u8], width: u32, height: u32) {
    console_log!("Inverting image: {}x{}", width, height);

    // RGBAの4チャンネル構成を前提とする
    let pixel_count = (width * height) as usize;

    for i in 0..pixel_count {
        let base_index = i * 4;

        if base_index + 3 >= pixels.len() {
            break;
        }

        // RGBAから各成分を取得
        let r = pixels[base_index];
        let g = pixels[base_index + 1];
        let b = pixels[base_index + 2];
        // アルファチャンネルはそのまま保持

        pixels[base_index] = 255 - r; // R
        pixels[base_index + 1] = 255 - g; // G
        pixels[base_index + 2] = 255 - b; // B
    }
}
