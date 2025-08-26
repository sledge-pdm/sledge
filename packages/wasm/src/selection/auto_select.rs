use wasm_bindgen::prelude::*;

/// しきい値付きの自動選択（領域抽出）
/// 入力バッファは RGBA 連続の &[u8]。変更せず、選択マスク(幅*高さ, 0/1)を返す。
#[wasm_bindgen]
pub fn auto_select_region_mask(
    buffer: &[u8],
    width: u32,
    height: u32,
    start_x: u32,
    start_y: u32,
    threshold: u8,
    _connectivity: u8, // 予備（4/8連結）。現状は4連結相当。
) -> Vec<u8> {
    let width = width as usize;
    let height = height as usize;
    let sx = start_x as usize;
    let sy = start_y as usize;

    // 範囲外は空マスク
    if sx >= width || sy >= height || width == 0 || height == 0 {
        return vec![0; width.saturating_mul(height)];
    }

    let start_index = (sy * width + sx) * 4;
    let target = [
        buffer[start_index],
        buffer[start_index + 1],
        buffer[start_index + 2],
        buffer[start_index + 3],
    ];

    let mut mask = vec![0u8; width * height];
    let mut visited = vec![false; width * height];

    // スタック（深さ優先）
    let mut stack = Vec::new();
    stack.push((sx, sy));

    while let Some((x, y)) = stack.pop() {
        if x >= width || y >= height { continue; }

        let flat = y * width + x;
        if visited[flat] { continue; }

        // 現在ピクセルが対象色か判定
        let idx = flat * 4;
        let current = [
            buffer[idx],
            buffer[idx + 1],
            buffer[idx + 2],
            buffer[idx + 3],
        ];
        if !colors_match(&current, &target, threshold) { continue; }

        // スキャンラインで左右に拡張
        let mut left = x;
        let mut right = x;

        // 左へ
        while left > 0 {
            let lf = y * width + (left - 1);
            if visited[lf] { break; }
            let li = lf * 4;
            let lc = [buffer[li], buffer[li + 1], buffer[li + 2], buffer[li + 3]];
            if colors_match(&lc, &target, threshold) {
                left -= 1;
            } else {
                break;
            }
        }

        // 右へ
        while right + 1 < width {
            let rf = y * width + (right + 1);
            if visited[rf] { break; }
            let ri = rf * 4;
            let rc = [buffer[ri], buffer[ri + 1], buffer[ri + 2], buffer[ri + 3]];
            if colors_match(&rc, &target, threshold) {
                right += 1;
            } else {
                break;
            }
        }

        // ラインをマーク
        for scan_x in left..=right {
            let f = y * width + scan_x;
            visited[f] = true;
            mask[f] = 1;
        }

        // 上下の次候補をプッシュ
        // 上
        if y > 0 {
            let up_y = y - 1;
            for scan_x in left..=right {
                let f = up_y * width + scan_x;
                if visited[f] { continue; }
                let i = f * 4;
                let c = [buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]];
                if colors_match(&c, &target, threshold) { stack.push((scan_x, up_y)); }
            }
        }
        // 下
        if y + 1 < height {
            let down_y = y + 1;
            for scan_x in left..=right {
                let f = down_y * width + scan_x;
                if visited[f] { continue; }
                let i = f * 4;
                let c = [buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]];
                if colors_match(&c, &target, threshold) { stack.push((scan_x, down_y)); }
            }
        }
    }

    mask
}

#[inline]
fn colors_match(color1: &[u8; 4], color2: &[u8; 4], threshold: u8) -> bool {
    if threshold == 0 { color1 == color2 } else {
        let dr = (color1[0] as i16 - color2[0] as i16).abs();
        let dg = (color1[1] as i16 - color2[1] as i16).abs();
        let db = (color1[2] as i16 - color2[2] as i16).abs();
        dr <= threshold as i16 && dg <= threshold as i16 && db <= threshold as i16
    }
}
