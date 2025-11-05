use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

use crate::console_log;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct DustRemovalOption {
    /// Maximum size of pixel groups to remove (1-100, groups with this many pixels or fewer will be removed)
    pub max_size: u32,
    /// Minimum alpha threshold to consider a pixel as non-transparent (0-255)
    pub alpha_threshold: u8,
}

#[wasm_bindgen]
impl DustRemovalOption {
    #[wasm_bindgen(constructor)]
    pub fn new(max_size: u32, alpha_threshold: u8) -> DustRemovalOption {
        DustRemovalOption {
            max_size: max_size.clamp(1, 1000),
            alpha_threshold,
        }
    }
}

/// Remove small isolated pixel groups (dust removal)
#[wasm_bindgen]
pub fn dust_removal(pixels: &mut [u8], width: u32, height: u32, options: &DustRemovalOption) {
    console_log!(
        "Applying dust removal: max_size={}, alpha_threshold={}",
        options.max_size,
        options.alpha_threshold
    );

    if width == 0 || height == 0 {
        return;
    }

    let w = width as i32;
    let h = height as i32;
    let pixel_count = (width * height) as usize;

    // Track processed pixels to avoid duplicate work
    let mut processed = vec![false; pixel_count];

    // 8-directional neighbors
    let directions = [
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    ];

    for y in 0..h {
        for x in 0..w {
            let index = (y * w + x) as usize;

            // Skip if already processed or pixel is transparent
            if processed[index] {
                continue;
            }

            let pixel_index = index * 4;
            if pixel_index + 3 >= pixels.len() {
                continue;
            }

            let alpha = pixels[pixel_index + 3];
            if alpha <= options.alpha_threshold {
                processed[index] = true;
                continue;
            }

            // Find connected component using flood fill
            let mut component_pixels = Vec::new();
            let mut queue = VecDeque::new();
            queue.push_back((x, y));
            processed[index] = true;

            while let Some((cx, cy)) = queue.pop_front() {
                component_pixels.push((cx, cy));

                // Check all 8 neighbors
                for (dx, dy) in directions.iter() {
                    let nx = cx + dx;
                    let ny = cy + dy;

                    // Bounds check
                    if nx < 0 || nx >= w || ny < 0 || ny >= h {
                        continue;
                    }

                    let neighbor_index = (ny * w + nx) as usize;
                    if processed[neighbor_index] {
                        continue;
                    }

                    let neighbor_pixel_index = neighbor_index * 4;
                    if neighbor_pixel_index + 3 >= pixels.len() {
                        continue;
                    }

                    let neighbor_alpha = pixels[neighbor_pixel_index + 3];
                    if neighbor_alpha > options.alpha_threshold {
                        processed[neighbor_index] = true;
                        queue.push_back((nx, ny));
                    }
                }
            }

            // If component is small enough, remove it
            if component_pixels.len() <= options.max_size as usize {
                for (px, py) in component_pixels {
                    let remove_index = ((py * w + px) * 4) as usize;
                    if remove_index + 3 < pixels.len() {
                        // Make pixel transparent
                        pixels[remove_index + 3] = 0; // Set alpha to 0
                        // Optionally clear RGB channels too
                        // pixels[remove_index] = 0;     // R
                        // pixels[remove_index + 1] = 0; // G
                        // pixels[remove_index + 2] = 0; // B
                    }
                }
            }
        }
    }
}

/// Remove small isolated pixel groups with default settings
#[wasm_bindgen]
pub fn dust_removal_simple(pixels: &mut [u8], width: u32, height: u32, max_size: u32) {
    let options = DustRemovalOption::new(max_size, 128);
    dust_removal(pixels, width, height, &options);
}
