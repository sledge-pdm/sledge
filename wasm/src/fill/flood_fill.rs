use wasm_bindgen::prelude::*;

use crate::fill::colors_match;

/// スキャンライン方式のFloodFill実装
///
/// この実装は以下の特徴を持ちます：
/// - メモリ効率的なスキャンライン方式
/// - スタックオーバーフロー回避
/// - 高速な隣接色判定
/// - 選択範囲制限サポート
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn scanline_flood_fill(
    buffer: &mut [u8],
    width: u32,
    height: u32,
    start_x: u32,
    start_y: u32,
    fill_color_r: u8,
    fill_color_g: u8,
    fill_color_b: u8,
    fill_color_a: u8,
    threshold: u8,
) -> bool {
    let width = width as usize;
    let height = height as usize;
    let start_x = start_x as usize;
    let start_y = start_y as usize;

    if start_x >= width || start_y >= height {
        return false;
    }

    let start_index = (start_y * width + start_x) * 4;
    let target_color = [
        buffer[start_index],
        buffer[start_index + 1],
        buffer[start_index + 2],
        buffer[start_index + 3],
    ];

    let fill_color = [fill_color_r, fill_color_g, fill_color_b, fill_color_a];

    // 既に同じ色の場合は何もしない
    // if colors_match(&target_color, &fill_color, 0) {
    //     return false;
    // }

    // しきい値が最大の場合、マスク条件に合致する全画素を高速に塗りつぶす
    if threshold == 255 {
        for y in 0..height {
            for x in 0..width {
                let idx = (y * width + x) * 4;
                buffer[idx] = fill_color[0];
                buffer[idx + 1] = fill_color[1];
                buffer[idx + 2] = fill_color[2];
                buffer[idx + 3] = fill_color[3];
            }
        }
        return true;
    }

    let mut stack = Vec::new();
    let mut visited = vec![false; width * height];
    stack.push((start_x, start_y));

    while let Some((x, y)) = stack.pop() {
        if x >= width || y >= height {
            continue;
        }

        let flat_index = y * width + x;
        if visited[flat_index] {
            continue;
        }

        let pixel_index = flat_index * 4;
        let current_color = [
            buffer[pixel_index],
            buffer[pixel_index + 1],
            buffer[pixel_index + 2],
            buffer[pixel_index + 3],
        ];

        // 対象色でない場合は継続
        if !colors_match(&current_color, &target_color, threshold) {
            continue;
        }

        // スキャンライン方式：左右に拡張
        let mut left = x;
        let mut right = x;

        // 左方向に拡張
        while left > 0 {
            let lf = y * width + (left - 1);
            if visited[lf] {
                break;
            }
            let left_index = lf * 4;
            let left_color = [
                buffer[left_index],
                buffer[left_index + 1],
                buffer[left_index + 2],
                buffer[left_index + 3],
            ];
            if colors_match(&left_color, &target_color, threshold) {
                left -= 1;
                visited[lf] = true;
            } else {
                break;
            }
        }

        // 右方向に拡張
        while right < width - 1 {
            let rf = y * width + (right + 1);
            if visited[rf] {
                break;
            }
            let right_index = rf * 4;
            let right_color = [
                buffer[right_index],
                buffer[right_index + 1],
                buffer[right_index + 2],
                buffer[right_index + 3],
            ];
            if colors_match(&right_color, &target_color, threshold) {
                right += 1;
                visited[rf] = true;
            } else {
                break;
            }
        }

        // 水平ラインを塗りつぶし
        for scan_x in left..=right {
            let flat = y * width + scan_x;
            visited[flat] = true;
            let scan_index = flat * 4;
            buffer[scan_index] = fill_color[0];
            buffer[scan_index + 1] = fill_color[1];
            buffer[scan_index + 2] = fill_color[2];
            buffer[scan_index + 3] = fill_color[3];
        }

        // 上下のピクセルをスタックに追加
        for scan_x in left..=right {
            // 上の行
            if y > 0 {
                let up_y = y - 1;
                let up_flat = up_y * width + scan_x;
                if !visited[up_flat] {
                    let up_index = up_flat * 4;
                    let up_color = [
                        buffer[up_index],
                        buffer[up_index + 1],
                        buffer[up_index + 2],
                        buffer[up_index + 3],
                    ];
                    if colors_match(&up_color, &target_color, threshold) {
                        stack.push((scan_x, up_y));
                    }
                }
            }

            // 下の行
            if y < height - 1 {
                let down_y = y + 1;
                let down_flat = down_y * width + scan_x;
                if !visited[down_flat] {
                    let down_index = down_flat * 4;
                    let down_color = [
                        buffer[down_index],
                        buffer[down_index + 1],
                        buffer[down_index + 2],
                        buffer[down_index + 3],
                    ];
                    if colors_match(&down_color, &target_color, threshold) {
                        stack.push((scan_x, down_y));
                    }
                }
            }
        }
    }

    true
}

/// 選択範囲制限付きスキャンライン FloodFill
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn scanline_flood_fill_with_mask(
    buffer: &mut [u8],
    width: u32,
    height: u32,
    start_x: u32,
    start_y: u32,
    fill_color_r: u8,
    fill_color_g: u8,
    fill_color_b: u8,
    fill_color_a: u8,
    threshold: u8,
    selection_mask: &[u8],
    limit_mode: &str,
) -> bool {
    let width = width as usize;
    let height = height as usize;
    let start_x = start_x as usize;
    let start_y = start_y as usize;

    if start_x >= width || start_y >= height {
        return false;
    }

    // 選択範囲制限チェック関数
    let is_allowed = |x: usize, y: usize| -> bool {
        let mask_index = y * width + x;
        if mask_index >= selection_mask.len() {
            return false;
        }
        let is_in_selection = selection_mask[mask_index] == 1;

        match limit_mode {
            "inside" => is_in_selection,
            "outside" => !is_in_selection,
            _ => true,
        }
    };

    // 開始位置が制限に違反していないかチェック
    if !is_allowed(start_x, start_y) {
        return false;
    }

    let start_index = (start_y * width + start_x) * 4;
    let target_color = [
        buffer[start_index],
        buffer[start_index + 1],
        buffer[start_index + 2],
        buffer[start_index + 3],
    ];

    let fill_color = [fill_color_r, fill_color_g, fill_color_b, fill_color_a];

    // 既に同じ色の場合は何もしない
    // if colors_match(&target_color, &fill_color, 0) {
    //     return false;
    // }

    // しきい値が最大の場合、マスク条件に合致する全画素を高速に塗りつぶす
    if threshold == 255 {
        for y in 0..height {
            for x in 0..width {
                if is_allowed(x, y) {
                    let idx = (y * width + x) * 4;
                    buffer[idx] = fill_color[0];
                    buffer[idx + 1] = fill_color[1];
                    buffer[idx + 2] = fill_color[2];
                    buffer[idx + 3] = fill_color[3];
                }
            }
        }
        return true;
    }

    let mut stack = Vec::new();
    let mut visited = vec![false; width * height];
    stack.push((start_x, start_y));

    while let Some((x, y)) = stack.pop() {
        if x >= width || y >= height {
            continue;
        }

        let flat_index = y * width + x;
        if visited[flat_index] {
            continue;
        }
        visited[flat_index] = true;

        // 選択範囲制限チェック
        if !is_allowed(x, y) {
            continue;
        }

        let pixel_index = flat_index * 4;
        let current_color = [
            buffer[pixel_index],
            buffer[pixel_index + 1],
            buffer[pixel_index + 2],
            buffer[pixel_index + 3],
        ];

        // 対象色でない場合は継続
        if !colors_match(&current_color, &target_color, threshold) {
            continue;
        }

        // スキャンライン方式：左右に拡張（選択範囲制限付き）
        let mut left = x;
        let mut right = x;

        // 左方向に拡張
        while left > 0 && is_allowed(left - 1, y) {
            let left_index = (y * width + (left - 1)) * 4;
            let left_color = [
                buffer[left_index],
                buffer[left_index + 1],
                buffer[left_index + 2],
                buffer[left_index + 3],
            ];
            if colors_match(&left_color, &target_color, threshold) {
                left -= 1;
                visited[y * width + left] = true;
            } else {
                break;
            }
        }

        // 右方向に拡張
        while right < width - 1 && is_allowed(right + 1, y) {
            let right_index = (y * width + (right + 1)) * 4;
            let right_color = [
                buffer[right_index],
                buffer[right_index + 1],
                buffer[right_index + 2],
                buffer[right_index + 3],
            ];
            if colors_match(&right_color, &target_color, threshold) {
                right += 1;
                visited[y * width + right] = true;
            } else {
                break;
            }
        }

        // 水平ラインを塗りつぶし
        for scan_x in left..=right {
            let scan_index = (y * width + scan_x) * 4;
            buffer[scan_index] = fill_color[0];
            buffer[scan_index + 1] = fill_color[1];
            buffer[scan_index + 2] = fill_color[2];
            buffer[scan_index + 3] = fill_color[3];
        }

        // 上下のピクセルをスタックに追加
        for scan_x in left..=right {
            // 上の行
            if y > 0 {
                let up_y = y - 1;
                let up_flat = up_y * width + scan_x;
                if !visited[up_flat] && is_allowed(scan_x, up_y) {
                    let up_index = up_flat * 4;
                    let up_color = [
                        buffer[up_index],
                        buffer[up_index + 1],
                        buffer[up_index + 2],
                        buffer[up_index + 3],
                    ];
                    if colors_match(&up_color, &target_color, threshold) {
                        stack.push((scan_x, up_y));
                    }
                }
            }

            // 下の行
            if y < height - 1 {
                let down_y = y + 1;
                let down_flat = down_y * width + scan_x;
                if !visited[down_flat] && is_allowed(scan_x, down_y) {
                    let down_index = down_flat * 4;
                    let down_color = [
                        buffer[down_index],
                        buffer[down_index + 1],
                        buffer[down_index + 2],
                        buffer[down_index + 3],
                    ];
                    if colors_match(&down_color, &target_color, threshold) {
                        stack.push((scan_x, down_y));
                    }
                }
            }
        }
    }

    true
}
