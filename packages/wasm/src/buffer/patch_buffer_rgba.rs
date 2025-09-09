use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn patch_buffer_rgba(
    // target
    target: &[u8],
    target_width: u32,
    target_height: u32,
    // patch
    patch: &[u8],
    patch_width: u32,
    patch_height: u32,
    offset_x: f32,
    offset_y: f32,
) -> Vec<u8> {
    let w = target_width as i32;
    let h = target_height as i32;

    // Expect RGBA buffers
    let mut result = target.to_vec();

    // Validate patch buffer size matches dimensions (RGBA)
    let src_w = patch_width as i32;
    let src_h = patch_height as i32;
    if src_w <= 0 || src_h <= 0 {
        return result;
    }
    if (src_w as usize) * (src_h as usize) * 4 != patch.len() {
        return result;
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
            let out_r = (px_r as f32 * src_a_f + dst_r * (1.0 - src_a_f))
                .round()
                .clamp(0.0, 255.0) as u8;
            let out_g = (px_g as f32 * src_a_f + dst_g * (1.0 - src_a_f))
                .round()
                .clamp(0.0, 255.0) as u8;
            let out_b = (px_b as f32 * src_a_f + dst_b * (1.0 - src_a_f))
                .round()
                .clamp(0.0, 255.0) as u8;
            let out_a = ((src_a_f + dst_a_f * (1.0 - src_a_f)) * 255.0)
                .round()
                .clamp(0.0, 255.0) as u8;

            result[tgt_start] = out_r;
            result[tgt_start + 1] = out_g;
            result[tgt_start + 2] = out_b;
            result[tgt_start + 3] = out_a;
        }
    }

    result
}
