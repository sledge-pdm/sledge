use wasm_bindgen::prelude::*;

/// Extract RGBA pixels from `source` where `mask` (1 byte per pixel) is zero.
/// - `source`: RGBA buffer (width=source_width, height=source_height)
/// - `mask`: 1 byte per pixel (0 or 1), dimensions `mask_width` x `mask_height`
/// - `mask_offset_x/y`: where to sample from the source for mask(0,0)
/// Returns an RGBA buffer sized `source_width * source_height * 4`, where selected pixels are fully transparent.
#[wasm_bindgen]
pub fn crop_patch_rgba(
    // source
    source: &[u8],
    source_width: u32,
    source_height: u32,
    // mask (1 byte per pixel)
    mask: &[u8],
    mask_width: u32,
    mask_height: u32,
    mask_offset_x: f32,
    mask_offset_y: f32,
) -> Vec<u8> {
    let sw = source_width as i32;
    let sh = source_height as i32;
    let mw = mask_width as i32;
    let mh = mask_height as i32;

    // Output buffer has same size as source (so we can patch back onto the same layer at (0,0))
    let mut result = vec![0u8; (source_width as usize) * (source_height as usize) * 4];

    // Offsets for where mask(0,0) maps on source
    let ox = mask_offset_x.round() as i32;
    let oy = mask_offset_y.round() as i32;

    for sy in 0..sh {
        for sx in 0..sw {
            // Corresponding mask coordinate
            let mx = sx - ox;
            let my = sy - oy;

            let mut selected = false;
            if mx >= 0 && mx < mw && my >= 0 && my < mh {
                let midx = (my * mw + mx) as usize;
                if midx < mask.len() {
                    selected = mask[midx] != 0;
                }
            }

            if !selected {
                // leave transparent
                continue;
            }

            let sidx = (sy * sw + sx) as usize * 4;
            if sidx + 3 >= source.len() { continue; }
            let didx = sidx; // same position in result

            result[didx] = source[sidx];
            result[didx + 1] = source[sidx + 1];
            result[didx + 2] = source[sidx + 2];
            result[didx + 3] = source[sidx + 3];
        }
    }

    result
}
