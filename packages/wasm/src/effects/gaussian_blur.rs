use wasm_bindgen::prelude::*;

use crate::console_log;

// より高度な画像処理の例：簡単なガウシアンブラー
#[wasm_bindgen]
pub fn gaussian_blur(pixels: &mut [u8], width: u32, height: u32, radius: f32) {
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
