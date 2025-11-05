use wasm_bindgen::prelude::*;

use crate::console_log;

// 画像を白黒（グレースケール）に変換する関数
#[wasm_bindgen]
pub fn grayscale(pixels: &mut [u8], width: u32, height: u32) {
    console_log!("Converting image to grayscale: {}x{}", width, height);

    // RGBAの4チャンネル構成を前提とする
    let pixel_count = (width * height) as usize;

    for i in 0..pixel_count {
        let base_index = i * 4;

        if base_index + 3 >= pixels.len() {
            break;
        }

        // RGBAから各成分を取得
        let r = pixels[base_index] as f32;
        let g = pixels[base_index + 1] as f32;
        let b = pixels[base_index + 2] as f32;
        // アルファチャンネルはそのまま保持

        // 輝度計算（ITU-R BT.709の標準的な重み付け）
        let gray_value = (0.2126 * r + 0.7152 * g + 0.0722 * b) as u8;

        // RGB全てに同じ値を設定してグレースケールにする
        pixels[base_index] = gray_value; // R
        pixels[base_index + 1] = gray_value; // G
        pixels[base_index + 2] = gray_value; // B
        // アルファチャンネル（pixels[base_index + 3]）はそのまま
    }
}
