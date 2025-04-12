use crate::commands::base64_utils::{decode_image_base64, encode_image_base64};
use image::{DynamicImage, RgbImage, Rgba, RgbaImage};
use jpeg_decoder::Decoder;
use jpeg_encoder::{ColorType, Encoder};
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use std::io::Cursor;

#[tauri::command]
pub fn jpeg_glitch(
    encoded: String,
    width: usize,
    height: usize,
    seed: u64,
    quality: u8,
    amount: f32, // 0.0〜1.0
) -> Result<String, String> {
    let decoded = decode_image_base64(&encoded)?;

    // RGBA → RGB
    let mut rgb = RgbImage::new(width as u32, height as u32);
    for (i, pixel) in decoded.chunks(4).enumerate() {
        let x = (i % width) as u32;
        let y = (i / width) as u32;
        rgb.put_pixel(x, y, image::Rgb([pixel[0], pixel[1], pixel[2]]));
    }

    // Encode to JPEG
    let mut jpeg_data: Vec<u8> = Vec::new();
    {
        let mut encoder = Encoder::new(&mut jpeg_data, quality);
        encoder
            .encode(&rgb, width as u16, height as u16, ColorType::Rgb)
            .map_err(|e| format!("JPEG encode failed: {e}"))?;
    }

    // Glitch parameters
    let mut rng = StdRng::seed_from_u64(seed);
    let start = 300;
    let length = jpeg_data.len().saturating_sub(start);
    let count = ((length as f32) * amount.clamp(0.0, 1.0)).round() as usize;

    for _ in 0..count {
        let idx = start + rng.random_range(0..length);
        jpeg_data[idx] = rng.random();
    }

    // Decode JPEG
    let mut decoder = Decoder::new(Cursor::new(&jpeg_data));
    let pixels = decoder
        .decode()
        .map_err(|e| format!("JPEG decode failed: {e}"))?;
    let info = decoder.info().ok_or("Missing JPEG info")?;

    // RGB → RGBA
    let mut rgba = RgbaImage::new(info.width as u32, info.height as u32);
    for (i, pixel) in pixels.chunks(3).enumerate() {
        let x = (i % info.width as usize) as u32;
        let y = (i / info.width as usize) as u32;
        rgba.put_pixel(x, y, Rgba([pixel[0], pixel[1], pixel[2], 255]));
    }

    encode_image_base64(&rgba.into_raw())
}
