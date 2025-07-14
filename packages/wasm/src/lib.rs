use wasm_bindgen::prelude::*;

// WebGL関連のモジュールを追加
pub mod webgl;
// 選択範囲関連のモジュールを追加
pub mod selection;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}

// 画像を白黒（グレースケール）に変換する関数
#[wasm_bindgen]
pub fn convert_to_grayscale(pixels: &mut [u8], width: u32, height: u32) {
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

// より高度な画像処理の例：簡単なガウシアンブラー
#[wasm_bindgen]
pub fn apply_gaussian_blur(pixels: &mut [u8], width: u32, height: u32, radius: f32) {
    console_log!("Applying Gaussian blur: radius={}", radius);

    if radius <= 0.0 {
        return;
    }

    let w = width as i32;
    let h = height as i32;
    let temp_pixels = pixels.to_vec();

    // 簡単な3x3カーネルによるブラー（近似）
    let kernel = [1.0, 2.0, 1.0, 2.0, 4.0, 2.0, 1.0, 2.0, 1.0];
    let kernel_sum = 16.0;

    for y in 1..(h - 1) {
        for x in 1..(w - 1) {
            for c in 0..3 {
                // RGB only, skip alpha
                let mut sum = 0.0;

                for ky in -1..=1 {
                    for kx in -1..=1 {
                        let px = x + kx;
                        let py = y + ky;
                        let pixel_index = ((py * w + px) * 4 + c as i32) as usize;
                        let kernel_index = ((ky + 1) * 3 + (kx + 1)) as usize;

                        if pixel_index < temp_pixels.len() {
                            sum += temp_pixels[pixel_index] as f32 * kernel[kernel_index];
                        }
                    }
                }

                let result_index = ((y * w + x) * 4 + c as i32) as usize;
                if result_index < pixels.len() {
                    pixels[result_index] = (sum / kernel_sum) as u8;
                }
            }
        }
    }
}
