use wasm_bindgen::prelude::*;

use crate::console_log;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub enum DitheringMode {
    /// Random dithering (white noise)
    Random = 0,
    /// Floyd-Steinberg error diffusion
    ErrorDiffusion = 1,
    /// Ordered dithering using Bayer matrix
    Ordered = 2,
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct DitheringOption {
    /// Dithering mode to use
    pub mode: DitheringMode,
    /// Number of levels per channel (2-32, affects quantization)
    pub levels: u32,
    /// Strength of dithering effect (0.0-1.0)
    pub strength: f32,
}

#[wasm_bindgen]
impl DitheringOption {
    #[wasm_bindgen(constructor)]
    pub fn new(mode: DitheringMode, levels: u32, strength: f32) -> DitheringOption {
        DitheringOption {
            mode,
            levels: levels.clamp(2, 32),
            strength: strength.clamp(0.0, 1.0),
        }
    }
}

// 4x4 Bayer matrix for ordered dithering
const BAYER_MATRIX_4X4: [[f32; 4]; 4] = [
    [0.0 / 16.0, 8.0 / 16.0, 2.0 / 16.0, 10.0 / 16.0],
    [12.0 / 16.0, 4.0 / 16.0, 14.0 / 16.0, 6.0 / 16.0],
    [3.0 / 16.0, 11.0 / 16.0, 1.0 / 16.0, 9.0 / 16.0],
    [15.0 / 16.0, 7.0 / 16.0, 13.0 / 16.0, 5.0 / 16.0],
];

// Simple linear congruential generator for random numbers
struct SimpleRng {
    state: u32,
}

impl SimpleRng {
    fn new(seed: u32) -> Self {
        SimpleRng { state: seed }
    }

    fn next(&mut self) -> f32 {
        self.state = self.state.wrapping_mul(1103515245).wrapping_add(12345);
        (self.state as f32) / (u32::MAX as f32)
    }
}

/// Apply dithering effect to the image
#[wasm_bindgen]
pub fn dithering(pixels: &mut [u8], width: u32, height: u32, options: &DitheringOption) {
    console_log!(
        "Applying dithering: mode={:?}, levels={}, strength={}",
        options.mode as u8,
        options.levels,
        options.strength
    );

    if width == 0 || height == 0 || options.levels < 2 {
        return;
    }

    let w = width as usize;
    let h = height as usize;

    // Calculate quantization step
    let step = 255.0 / (options.levels - 1) as f32;

    match options.mode {
        DitheringMode::Random => apply_random_dithering(pixels, w, h, step, options.strength),
        DitheringMode::ErrorDiffusion => {
            apply_error_diffusion_dithering(pixels, w, h, step, options.strength)
        }
        DitheringMode::Ordered => apply_ordered_dithering(pixels, w, h, step, options.strength),
    }
}

fn apply_random_dithering(
    pixels: &mut [u8],
    width: usize,
    height: usize,
    step: f32,
    strength: f32,
) {
    let mut rng = SimpleRng::new(12345); // Fixed seed for reproducible results

    for y in 0..height {
        for x in 0..width {
            let pixel_index = (y * width + x) * 4;

            if pixel_index + 3 >= pixels.len() {
                continue;
            }

            // Process RGB channels (skip alpha)
            for c in 0..3 {
                let channel_index = pixel_index + c;
                let original_value = pixels[channel_index] as f32;

                // Add random noise
                let noise = (rng.next() - 0.5) * 2.0 * strength * step;
                let noisy_value = original_value + noise;

                // Quantize
                let level = (noisy_value / step)
                    .round()
                    .clamp(0.0, (255.0 / step).floor());
                let quantized_value = (level * step).clamp(0.0, 255.0) as u8;

                pixels[channel_index] = quantized_value;
            }
        }
    }
}

fn apply_error_diffusion_dithering(
    pixels: &mut [u8],
    width: usize,
    height: usize,
    step: f32,
    strength: f32,
) {
    // Create a copy for error calculations
    let mut temp_pixels: Vec<f32> = pixels.iter().map(|&p| p as f32).collect();

    for y in 0..height {
        for x in 0..width {
            let pixel_index = (y * width + x) * 4;

            if pixel_index + 3 >= temp_pixels.len() {
                continue;
            }

            // Process RGB channels (skip alpha)
            for c in 0..3 {
                let channel_index = pixel_index + c;
                let old_value = temp_pixels[channel_index];

                // Quantize
                let level = (old_value / step)
                    .round()
                    .clamp(0.0, (255.0 / step).floor());
                let new_value = level * step;
                temp_pixels[channel_index] = new_value;

                // Calculate quantization error
                let error = (old_value - new_value) * strength;

                // Distribute error using Floyd-Steinberg weights
                // [current] [7/16]
                // [3/16] [5/16] [1/16]

                // Right pixel (x+1, y)
                if x + 1 < width {
                    let right_index = (y * width + (x + 1)) * 4 + c;
                    if right_index < temp_pixels.len() {
                        temp_pixels[right_index] += error * (7.0 / 16.0);
                    }
                }

                // Bottom-left pixel (x-1, y+1)
                if y + 1 < height && x > 0 {
                    let bl_index = ((y + 1) * width + (x - 1)) * 4 + c;
                    if bl_index < temp_pixels.len() {
                        temp_pixels[bl_index] += error * (3.0 / 16.0);
                    }
                }

                // Bottom pixel (x, y+1)
                if y + 1 < height {
                    let bottom_index = ((y + 1) * width + x) * 4 + c;
                    if bottom_index < temp_pixels.len() {
                        temp_pixels[bottom_index] += error * (5.0 / 16.0);
                    }
                }

                // Bottom-right pixel (x+1, y+1)
                if y + 1 < height && x + 1 < width {
                    let br_index = ((y + 1) * width + (x + 1)) * 4 + c;
                    if br_index < temp_pixels.len() {
                        temp_pixels[br_index] += error * (1.0 / 16.0);
                    }
                }
            }
        }
    }

    // Copy results back to original buffer
    for i in 0..pixels.len() {
        pixels[i] = temp_pixels[i].clamp(0.0, 255.0) as u8;
    }
}

fn apply_ordered_dithering(
    pixels: &mut [u8],
    width: usize,
    height: usize,
    step: f32,
    strength: f32,
) {
    for y in 0..height {
        for x in 0..width {
            let pixel_index = (y * width + x) * 4;

            if pixel_index + 3 >= pixels.len() {
                continue;
            }

            // Get Bayer matrix threshold for this position
            let matrix_x = x % 4;
            let matrix_y = y % 4;
            let threshold = BAYER_MATRIX_4X4[matrix_y][matrix_x];

            // Process RGB channels (skip alpha)
            for c in 0..3 {
                let channel_index = pixel_index + c;
                let original_value = pixels[channel_index] as f32;

                // Add threshold-based noise
                let noise = (threshold - 0.5) * strength * step;
                let noisy_value = original_value + noise;

                // Quantize
                let level = (noisy_value / step)
                    .round()
                    .clamp(0.0, (255.0 / step).floor());
                let quantized_value = (level * step).clamp(0.0, 255.0) as u8;

                pixels[channel_index] = quantized_value;
            }
        }
    }
}

/// Apply random dithering with simple parameters
#[wasm_bindgen]
pub fn dithering_random(pixels: &mut [u8], width: u32, height: u32, levels: u32) {
    let options = DitheringOption::new(DitheringMode::Random, levels, 1.0);
    dithering(pixels, width, height, &options);
}

/// Apply error diffusion dithering with simple parameters
#[wasm_bindgen]
pub fn dithering_error_diffusion(pixels: &mut [u8], width: u32, height: u32, levels: u32) {
    let options = DitheringOption::new(DitheringMode::ErrorDiffusion, levels, 1.0);
    dithering(pixels, width, height, &options);
}

/// Apply ordered dithering with simple parameters
#[wasm_bindgen]
pub fn dithering_ordered(pixels: &mut [u8], width: u32, height: u32, levels: u32) {
    let options = DitheringOption::new(DitheringMode::Ordered, levels, 1.0);
    dithering(pixels, width, height, &options);
}
