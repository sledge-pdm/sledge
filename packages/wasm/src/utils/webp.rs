// use wasm_bindgen::prelude::*;

// use webp::{Decoder, Encoder};

// #[wasm_bindgen]
// extern "C" {
// }

// /// RGBAバッファからwebpに変換
// #[wasm_bindgen]
// pub fn buffer_2_webp(pixels: &mut [u8], width: u32, height: u32) -> Vec<u8> {
//     let webp = Encoder::from_rgba(pixels, width, height).encode(0.75);

//     webp.to_vec()
// }

// /// webpからRGBAバッファに変換
// #[wasm_bindgen]
// pub fn webp_2_buffer(webp: &mut [u8]) -> Vec<u8> {
//     let pixels = Decoder::new(webp).decode().expect("Failed to decode webp");

//     pixels.to_image().to_rgba8().into_raw()
// }
