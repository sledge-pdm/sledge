use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn patch_buffer(
    target: &[u8],
    patch: &[u8],
    offset_x: f32,
    offset_y: f32,
    width: u32,
    height: u32,
) -> Vec<u8> {
    let w = width as i32;
    let h = height as i32;

    // Expect RGBA buffers
    let mut result = target.to_vec();

    // patch is assumed to be RGBA and its size determines src width/height implicitly
    let patch_len = patch.len();
    if patch_len % 4 != 0 {
        return result;
    }

    let src_pixels = (patch_len / 4) as i32;
    // If patch represents a full-width image it may be width*height, but we don't know src width.
    // We'll try to infer src width as w if it divides evenly, otherwise treat src as linear strip of width w.
    // Better approach: caller should pass properly sized patch (matching intended src width/height).

    // For simplicity assume patch width == w and derive src_h accordingly when possible.
    let mut src_w = w;
    if src_w <= 0 { return result; }
    let mut src_h = src_pixels / src_w;
    if src_h * src_w != src_pixels {
        // fallback: treat patch as same dimensions as target
        src_w = w;
        src_h = h;
        if src_h * src_w != src_pixels {
            // cannot determine shape; abort
            return result;
        }
    }

    let dx = offset_x.round() as i32;
    let dy = offset_y.round() as i32;

    for sy in 0..src_h {
        for sx in 0..src_w {
            let src_idx = (sy * src_w + sx) as usize;
            let src_start = src_idx * 4;
            if src_start + 3 >= patch.len() {
                continue;
            }

            let px_r = patch[src_start] as u8;
            let px_g = patch[src_start + 1] as u8;
            let px_b = patch[src_start + 2] as u8;
            let px_a = patch[src_start + 3] as u8;

            if px_a == 0 {
                continue;
            }

            let tx = sx + dx;
            let ty = sy + dy;

            if tx < 0 || tx >= w || ty < 0 || ty >= h {
                continue;
            }

            let tgt_idx = (ty * w + tx) as usize;
            let tgt_start = tgt_idx * 4;
            if tgt_start + 3 >= result.len() {
                continue;
            }

            let dst_r = result[tgt_start] as f32;
            let dst_g = result[tgt_start + 1] as f32;
            let dst_b = result[tgt_start + 2] as f32;
            let dst_a = result[tgt_start + 3] as f32;

            let src_a_f = px_a as f32 / 255.0;
            let dst_a_f = dst_a / 255.0;

            // premultiplied-like alpha blend (source over)
            let out_r = (px_r as f32 * src_a_f + dst_r * (1.0 - src_a_f)).round().clamp(0.0, 255.0) as u8;
            let out_g = (px_g as f32 * src_a_f + dst_g * (1.0 - src_a_f)).round().clamp(0.0, 255.0) as u8;
            let out_b = (px_b as f32 * src_a_f + dst_b * (1.0 - src_a_f)).round().clamp(0.0, 255.0) as u8;
            let out_a = ((src_a_f + dst_a_f * (1.0 - src_a_f)) * 255.0).round().clamp(0.0, 255.0) as u8;

            result[tgt_start] = out_r;
            result[tgt_start + 1] = out_g;
            result[tgt_start + 2] = out_b;
            result[tgt_start + 3] = out_a;
        }
    }

    result
}
