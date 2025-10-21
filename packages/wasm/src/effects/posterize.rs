use wasm_bindgen::prelude::*;

use crate::console_log;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct PosterizeOption {
    /// Number of levels per channel (1-32, higher values preserve more detail)
    pub levels: u32,
}

#[wasm_bindgen]
impl PosterizeOption {
    #[wasm_bindgen(constructor)]
    pub fn new(levels: u32) -> PosterizeOption {
        PosterizeOption {
            levels: levels.clamp(1, 32),
        }
    }
}

/// Apply posterize effect to reduce the number of color levels
#[wasm_bindgen]
pub fn posterize(pixels: &mut [u8], width: u32, height: u32, options: &PosterizeOption) {
    console_log!("Applying posterize effect: levels={}", options.levels);

    if options.levels < 1 {
        return;
    }

    let pixel_count = (width * height) as usize;

    // Calculate step size for quantization
    let step = 255.0 / (options.levels - 1) as f32;

    for i in 0..pixel_count {
        let base_index = i * 4;

        if base_index + 3 >= pixels.len() {
            break;
        }

        // Process RGB channels (skip alpha)
        for c in 0..3 {
            let channel_index = base_index + c;
            let original_value = pixels[channel_index] as f32;

            // Quantize the value to the specified number of levels
            let level = (original_value / step).round() as u32;
            let quantized_value = (level as f32 * step).clamp(0.0, 255.0) as u8;

            pixels[channel_index] = quantized_value;
        }
        // Alpha channel remains unchanged
    }
}

/// Apply posterize effect with simple level parameter
#[wasm_bindgen]
pub fn posterize_simple(pixels: &mut [u8], width: u32, height: u32, levels: u32) {
    let options = PosterizeOption::new(levels);
    posterize(pixels, width, height, &options);
}
