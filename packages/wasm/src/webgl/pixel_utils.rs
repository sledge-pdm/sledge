use wasm_bindgen::prelude::*;

/// ピクセルデータを上下反転する関数
/// WebGLのreadPixelsは下から上の順序で返すため、通常の画像として使う場合は反転が必要
#[wasm_bindgen]
pub fn flip_pixels_vertically(pixels: &mut [u8], width: u32, height: u32) {
    let width = width as usize;
    let height = height as usize;
    let bytes_per_pixel = 4; // RGBA
    let row_size = width * bytes_per_pixel;

    // 上半分と下半分を入れ替える
    for y in 0..(height / 2) {
        let top_row_start = y * row_size;
        let bottom_row_start = (height - 1 - y) * row_size;

        // 一行分のデータを入れ替え
        for x in 0..row_size {
            pixels.swap(top_row_start + x, bottom_row_start + x);
        }
    }
}

/// タイルバッファから指定領域のピクセルデータを抽出する関数
/// WebGLRendererのrender()メソッドで使用される重い処理を最適化
#[wasm_bindgen]
pub fn extract_tile_buffer(
    source_buffer: &[u8],
    source_width: u32,
    _source_height: u32,
    tile_x: u32,
    tile_y: u32,
    tile_width: u32,
    tile_height: u32,
) -> Vec<u8> {
    let source_width = source_width as usize;
    let tile_width = tile_width as usize;
    let tile_height = tile_height as usize;
    let tile_x = tile_x as usize;
    let tile_y = tile_y as usize;
    let bytes_per_pixel = 4; // RGBA

    let tile_buffer_size = tile_width * tile_height * bytes_per_pixel;
    let mut tile_buffer = Vec::with_capacity(tile_buffer_size);

    // タイル領域のピクセルデータを行ごとにコピー
    for dy in 0..tile_height {
        let source_row_start = ((tile_y + dy) * source_width + tile_x) * bytes_per_pixel;
        let source_row_end = source_row_start + tile_width * bytes_per_pixel;

        if source_row_end <= source_buffer.len() {
            tile_buffer.extend_from_slice(&source_buffer[source_row_start..source_row_end]);
        } else {
            // バッファ範囲外の場合は透明ピクセル（0,0,0,0）で埋める
            for _ in 0..(tile_width * bytes_per_pixel) {
                tile_buffer.push(0);
            }
        }
    }

    tile_buffer
}

/// 複数のピクセルバッファをブレンドする関数（CPUベースの最適化）
/// レイヤーの不透明度とブレンドモードを考慮した合成処理
#[wasm_bindgen]
pub fn blend_layers(
    base_buffer: &mut [u8],
    overlay_buffer: &[u8],
    width: u32,
    height: u32,
    opacity: f32,
    blend_mode: u32, // 0: normal, 1: multiply, 2: screen, etc.
) {
    let pixel_count = (width * height) as usize;
    let opacity = opacity.clamp(0.0, 1.0);

    for i in 0..pixel_count {
        let base_index = i * 4;
        if base_index + 3 >= base_buffer.len() || base_index + 3 >= overlay_buffer.len() {
            break;
        }

        // RGBA成分を取得
        let base_r = base_buffer[base_index] as f32 / 255.0;
        let base_g = base_buffer[base_index + 1] as f32 / 255.0;
        let base_b = base_buffer[base_index + 2] as f32 / 255.0;
        let base_a = base_buffer[base_index + 3] as f32 / 255.0;

        let overlay_r = overlay_buffer[base_index] as f32 / 255.0;
        let overlay_g = overlay_buffer[base_index + 1] as f32 / 255.0;
        let overlay_b = overlay_buffer[base_index + 2] as f32 / 255.0;
        let overlay_a = overlay_buffer[base_index + 3] as f32 / 255.0;

        // ブレンドモードに応じた計算
        let (blended_r, blended_g, blended_b) = match blend_mode {
            1 => (
                // Multiply
                base_r * overlay_r,
                base_g * overlay_g,
                base_b * overlay_b,
            ),
            2 => (
                // Screen
                1.0 - (1.0 - base_r) * (1.0 - overlay_r),
                1.0 - (1.0 - base_g) * (1.0 - overlay_g),
                1.0 - (1.0 - base_b) * (1.0 - overlay_b),
            ),
            _ => (
                // Normal (alpha blending)
                overlay_r, overlay_g, overlay_b,
            ),
        };

        // 不透明度を適用したアルファブレンディング
        let final_alpha = overlay_a * opacity;
        let result_r = base_r * (1.0 - final_alpha) + blended_r * final_alpha;
        let result_g = base_g * (1.0 - final_alpha) + blended_g * final_alpha;
        let result_b = base_b * (1.0 - final_alpha) + blended_b * final_alpha;
        let result_a = base_a + overlay_a * opacity * (1.0 - base_a);

        // 結果を書き戻し
        base_buffer[base_index] = (result_r * 255.0) as u8;
        base_buffer[base_index + 1] = (result_g * 255.0) as u8;
        base_buffer[base_index + 2] = (result_b * 255.0) as u8;
        base_buffer[base_index + 3] = (result_a * 255.0) as u8;
    }
}

/// メモリ使用量を計算するユーティリティ関数
#[wasm_bindgen]
pub fn calculate_texture_memory_usage(width: u32, height: u32, layer_count: u32) -> u32 {
    width * height * layer_count * 4 // RGBA = 4 bytes per pixel
}
