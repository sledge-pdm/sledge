use wasm_bindgen::prelude::*;

/// Extract RGBA pixels from `source` where `mask` (1 byte per pixel) is non-zero.
/// - `source`: RGBA buffer (width=source_width, height=source_height)
/// - `mask`: 1 byte per pixel (0 or 1), dimensions `mask_width` x `mask_height`
/// - `mask_offset_x/y`: where to sample from the source for mask(0,0)
/// Returns an RGBA buffer sized `mask_width * mask_height * 4`, where non-selected pixels are fully transparent.
#[wasm_bindgen]
pub fn slice_patch_rgba(
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

    // Output buffer has same dims as mask (RGBA)
    let mut result = vec![0u8; (mask_width as usize) * (mask_height as usize) * 4];

    // Offsets (rounded to nearest int)
    let ox = mask_offset_x.round() as i32;
    let oy = mask_offset_y.round() as i32;

    for y in 0..mh {
        for x in 0..mw {
            let mi = (y * mw + x) as usize; // mask index (1 byte/pixel)
            if mi >= mask.len() { continue; }
            if mask[mi] == 0 { continue; } // not selected

            let sx = x + ox;
            let sy = y + oy;
            if sx < 0 || sy < 0 || sx >= sw || sy >= sh { continue; }

            let src_start = ((sy * sw + sx) as usize) * 4;
            if src_start + 3 >= source.len() { continue; }

            let dst_start = (mi as usize) * 4; // same layout as mask (RGBA)
            result[dst_start] = source[src_start];
            result[dst_start + 1] = source[src_start + 1];
            result[dst_start + 2] = source[src_start + 2];
            result[dst_start + 3] = source[src_start + 3];
        }
    }

    result
}
