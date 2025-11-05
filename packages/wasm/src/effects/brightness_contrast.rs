use wasm_bindgen::prelude::*;

use crate::console_log;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct BrightnessContrastOption {
    /// Brightness adjustment (-100.0 to 100.0, 0.0 = no change)
    pub brightness: f32,
    /// Contrast adjustment (-100.0 to 100.0, 0.0 = no change)  
    pub contrast: f32,
}

#[wasm_bindgen]
impl BrightnessContrastOption {
    #[wasm_bindgen(constructor)]
    pub fn new(brightness: f32, contrast: f32) -> BrightnessContrastOption {
        BrightnessContrastOption {
            brightness: brightness.clamp(-100.0, 100.0),
            contrast: contrast.clamp(-100.0, 100.0),
        }
    }
}

/// Apply brightness and contrast adjustments to the image
#[wasm_bindgen]
pub fn brightness_contrast(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    options: &BrightnessContrastOption,
) {
    console_log!(
        "Applying brightness/contrast: brightness={}, contrast={}",
        options.brightness,
        options.contrast
    );

    // Convert percentage values to actual multipliers
    let brightness_offset = (options.brightness / 100.0) * 255.0;
    let contrast_factor = 1.0 + (options.contrast / 100.0);

    let pixel_count = (width * height) as usize;

    for i in 0..pixel_count {
        let base_index = i * 4;

        if base_index + 3 >= pixels.len() {
            break;
        }

        // Process RGB channels (skip alpha)
        for c in 0..3 {
            let channel_index = base_index + c;
            let original_value = pixels[channel_index] as f32;

            // Apply contrast first (around midpoint 127.5)
            let contrasted = ((original_value - 127.5) * contrast_factor) + 127.5;

            // Then apply brightness
            let adjusted = contrasted + brightness_offset;

            // Clamp to valid range [0, 255]
            pixels[channel_index] = adjusted.clamp(0.0, 255.0) as u8;
        }
        // Alpha channel remains unchanged
    }
}

/// Apply only brightness adjustment to the image
#[wasm_bindgen]
pub fn brightness(pixels: &mut [u8], width: u32, height: u32, brightness: f32) {
    let options = BrightnessContrastOption::new(brightness, 0.0);
    brightness_contrast(pixels, width, height, &options);
}

/// Apply only contrast adjustment to the image
#[wasm_bindgen]
pub fn contrast(pixels: &mut [u8], width: u32, height: u32, contrast: f32) {
    let options = BrightnessContrastOption::new(0.0, contrast);
    brightness_contrast(pixels, width, height, &options);
}
