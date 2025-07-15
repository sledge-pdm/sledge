use wasm_bindgen::prelude::*;

// アウトライン生成のモジュールを追加
pub mod outline;
// マスク操作のモジュールを追加
pub mod mask_ops;

/// 選択範囲の移動プレビューを生成する
/// original_buffer: 元のピクセルバッファ (RGBA)
/// selection_mask: 選択範囲のマスク (0 or 1)
/// offset_x, offset_y: 移動オフセット (float対応)
/// width, height: 画像のサイズ
#[wasm_bindgen]
pub fn preview_move(
    original_buffer: &[u8],
    selection_mask: &[u8],
    offset_x: f32,
    offset_y: f32,
    width: u32,
    height: u32,
) -> Vec<u8> {
    let w = width as i32;
    let h = height as i32;
    let total_pixels = (width * height) as usize;
    
    // 結果バッファを初期化（元のバッファをコピー）
    let mut result = original_buffer.to_vec();
    
    // オフセットを整数に変換（将来的にサブピクセル精度も対応可能）
    let dx = offset_x.round() as i32;
    let dy = offset_y.round() as i32;
    
    // 選択範囲のピクセルを一時保存
    let mut selected_pixels: Vec<Option<[u8; 4]>> = vec![None; total_pixels];
    
    // Step 1: 選択範囲のピクセルを抽出し、元の位置をクリア
    for y in 0..h {
        for x in 0..w {
            let idx = (y * w + x) as usize;
            
            if idx < selection_mask.len() && selection_mask[idx] == 1 {
                let pixel_start = idx * 4;
                if pixel_start + 3 < original_buffer.len() {
                    // 選択されたピクセルを保存
                    selected_pixels[idx] = Some([
                        original_buffer[pixel_start],
                        original_buffer[pixel_start + 1],
                        original_buffer[pixel_start + 2],
                        original_buffer[pixel_start + 3],
                    ]);
                    
                    // 元の位置を透明にする（選択範囲を「切り取り」状態にする）
                    result[pixel_start] = 0;     // R
                    result[pixel_start + 1] = 0; // G
                    result[pixel_start + 2] = 0; // B
                    result[pixel_start + 3] = 0; // A (完全透明)
                }
            }
        }
    }
    
    // Step 2: 選択範囲のピクセルを移動先に配置
    for y in 0..h {
        for x in 0..w {
            let idx = (y * w + x) as usize;
            
            if let Some(pixel) = selected_pixels[idx] {
                // 移動先の座標を計算
                let new_x = x + dx;
                let new_y = y + dy;
                
                // 範囲内チェック
                if new_x >= 0 && new_x < w && new_y >= 0 && new_y < h {
                    let new_idx = (new_y * w + new_x) as usize;
                    let new_pixel_start = new_idx * 4;
                    
                    if new_pixel_start + 3 < result.len() {
                        // アルファブレンディング（移動したピクセルを重ねる）
                        let src_alpha = pixel[3] as f32 / 255.0;
                        let dst_alpha = result[new_pixel_start + 3] as f32 / 255.0;
                        
                        if src_alpha > 0.0 {
                            if dst_alpha > 0.0 {
                                // 両方とも不透明な場合はアルファブレンディング
                                let inv_src_alpha = 1.0 - src_alpha;
                                result[new_pixel_start] = (pixel[0] as f32 * src_alpha + result[new_pixel_start] as f32 * inv_src_alpha) as u8;
                                result[new_pixel_start + 1] = (pixel[1] as f32 * src_alpha + result[new_pixel_start + 1] as f32 * inv_src_alpha) as u8;
                                result[new_pixel_start + 2] = (pixel[2] as f32 * src_alpha + result[new_pixel_start + 2] as f32 * inv_src_alpha) as u8;
                                result[new_pixel_start + 3] = ((src_alpha + dst_alpha * inv_src_alpha) * 255.0) as u8;
                            } else {
                                // 移動先が透明な場合は単純に配置
                                result[new_pixel_start] = pixel[0];
                                result[new_pixel_start + 1] = pixel[1];
                                result[new_pixel_start + 2] = pixel[2];
                                result[new_pixel_start + 3] = pixel[3];
                            }
                        }
                    }
                }
            }
        }
    }
    
    result
}
