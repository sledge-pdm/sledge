use wasm_bindgen::prelude::*;

/// ピクセルデータを上下反転する関数
/// WebGLのreadPixelsは下から上の順序で返すため、通常の画像として使う場合は反転が必要
#[wasm_bindgen]
pub fn flip_pixels_vertically(pixels: &mut [u8], width: u32, height: u32) {
    let width = width as usize;
    let height = height as usize;
    let bytes_per_pixel = 4; // RGBA
    let row_size = width * bytes_per_pixel;

    // 上半分と下半分を入れ替える
    for y in 0..(height / 2) {
        let top_row_start = y * row_size;
        let bottom_row_start = (height - 1 - y) * row_size;

        // 一行分のデータを入れ替え
        for x in 0..row_size {
            pixels.swap(top_row_start + x, bottom_row_start + x);
        }
    }
}
