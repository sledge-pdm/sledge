use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn slice_patch_rgba(
    // source
    source: &[u8],
    source_width: u32,
    source_height: u32,
    // mask
    mask: &[u8],
    mask_width: u32,
    mask_height: u32,
    mask_offset_x: f32,
    mask_offset_y: f32,
) -> Vec<u8> {
    let mut result = vec![0u8; mask_width as usize * mask_height as usize * 4];

    for y in 0..mask_height {
        for x in 0..mask_width {
            let src_idx = (((y + mask_offset_y as u32) * source_width + (x + mask_offset_x as u32)) * 4) as usize;
            let mask_idx = ((y * mask_width + x) * 4) as usize;

            if mask_idx < mask.len() && mask[mask_idx] == 0 {
                // If the mask is 0, skip this pixel
                continue;
            }

            if src_idx + 3 < source.len() {
                result[mask_idx] = source[src_idx];
                result[mask_idx + 1] = source[src_idx + 1];
                result[mask_idx + 2] = source[src_idx + 2];
                result[mask_idx + 3] = source[src_idx + 3];
            }
        }
    }

    result
}
