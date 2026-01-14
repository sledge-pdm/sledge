use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn trim_mask_with_box(
    mask: &[u8],
    mask_width: u32,
    mask_height: u32,
    box_x: u32,
    box_y: u32,
    box_width: u32,
    box_height: u32,
) -> Vec<u8> {
    let mw = mask_width as i32;
    let _mh = mask_height as i32;
    let bw = box_width as i32;
    let bh = box_height as i32;

    // Output mask has same dims as box
    let mut result = vec![0u8; (box_width as usize) * (box_height as usize)];

    // Offsets
    let ox = box_x as i32;
    let oy = box_y as i32;

    for y in 0..bh {
        for x in 0..bw {
            let bi = (y * bw + x) as usize; // bbox index (1 byte/pixel)
            let src_x = ox + x;
            let src_y = oy + y;
            let si = (src_y * mw + src_x) as usize;

            result[bi] = mask[si];
        }
    }

    result
}
