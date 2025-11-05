use wasm_bindgen::prelude::*;

use crate::console_log;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum AlphaBlurMode {
    /// Skip alpha channel (preserve original alpha values)
    Skip = 0,
    /// Apply blur to alpha channel as well
    Blur = 1,
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct GaussianBlurOption {
    /// Blur radius (higher values create stronger blur effect)
    pub radius: f32,
    /// How to handle the alpha channel
    pub alpha_mode: AlphaBlurMode,
}

#[wasm_bindgen]
impl GaussianBlurOption {
    #[wasm_bindgen(constructor)]
    pub fn new(radius: f32, alpha_mode: AlphaBlurMode) -> GaussianBlurOption {
        GaussianBlurOption { radius, alpha_mode }
    }
}

// より高度な画像処理の例：簡単なガウシアンブラー
#[wasm_bindgen]
pub fn gaussian_blur(pixels: &mut [u8], width: u32, height: u32, options: &GaussianBlurOption) {
    console_log!(
        "Applying Gaussian blur: radius={}, alpha_mode={:?}",
        options.radius,
        options.alpha_mode as u8
    );

    if options.radius <= 0.0 {
        return;
    }

    let w = width as i32;
    let h = height as i32;
    let temp_pixels = pixels.to_vec();

    // 簡単な3x3カーネルによるブラー（近似）
    let kernel = [1.0, 2.0, 1.0, 2.0, 4.0, 2.0, 1.0, 2.0, 1.0];
    // let kernel_sum = 16.0;

    for y in 0..=(h - 1) {
        for x in 0..=(w - 1) {
            // Determine how many channels to process based on alpha mode
            let channels_to_process = match options.alpha_mode {
                AlphaBlurMode::Skip => 3, // RGB only
                AlphaBlurMode::Blur => 4, // RGBA
            };

            for c in 0..channels_to_process {
                let mut sum = 0.0;
                let mut weight_sum = 0.0;

                for ky in -1..=1 {
                    for kx in -1..=1 {
                        let px = x + kx;
                        let py = y + ky;

                        // 境界チェック - 画像内の有効なピクセルのみ処理
                        if px >= 0 && px < w && py >= 0 && py < h {
                            let pixel_index = ((py * w + px) * 4 + c) as usize;
                            let kernel_index = ((ky + 1) * 3 + (kx + 1)) as usize;

                            let weight = kernel[kernel_index];
                            sum += temp_pixels[pixel_index] as f32 * weight;
                            weight_sum += weight;
                        }
                    }
                }

                let result_index = ((y * w + x) * 4 + c) as usize;
                if result_index < pixels.len() {
                    // 実際に使用した重みで正規化
                    pixels[result_index] = if weight_sum > 0.0 {
                        (sum / weight_sum) as u8
                    } else {
                        temp_pixels[result_index] // フォールバック
                    };
                }
            }
        }
    }
}
