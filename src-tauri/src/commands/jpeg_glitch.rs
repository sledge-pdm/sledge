use crate::commands::base64_utils::decode_image_base64;
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use image::codecs::jpeg::JpegEncoder;
use image::{ImageBuffer, RgbaImage};
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};

use std::fs::File;
use std::io::Cursor;
use std::path::Path;

#[tauri::command]
pub fn jpeg_glitch(
    encoded: String,
    width: usize,
    height: usize,
    seed: u64,
) -> Result<String, String> {
    // RGBA raw バッファを取得
    let raw = decode_image_base64(&encoded)?;
    if raw.len() != width * height * 4 {
        return Err("Invalid image size".to_string());
    }

    // RGBA → image crate の ImageBuffer に変換
    let img: RgbaImage = ImageBuffer::from_raw(width as u32, height as u32, raw)
        .ok_or("Image buffer conversion failed")?;

    // JPEGデータを書き込む Vec<u8> バッファを用意
    let mut jpeg_buffer: Vec<u8> = Vec::new();
    let mut encoder = JpegEncoder::new_with_quality(&mut jpeg_buffer, 80);
    encoder.encode_image(&img).map_err(|e| e.to_string())?;

    // バイナリ破壊処理：ヘッダー除いてランダムに改変
    let mut rng = StdRng::seed_from_u64(seed);
    for _ in 0..10 {
        let idx = rng.random_range(100..jpeg_buffer.len());
        jpeg_buffer[idx] = rng.random();
    }

    // base64エンコードして data URI に
    let b64 = STANDARD.encode(&jpeg_buffer);
    let mime = format!("data:image/jpeg;base64,{}", b64);

    Ok(mime)
}
