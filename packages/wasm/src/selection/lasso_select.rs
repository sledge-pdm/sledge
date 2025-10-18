use wasm_bindgen::prelude::*;

/// Lasso選択のためのスキャンライン塗りつぶし実装
///
/// この実装は以下の特徴を持ちます：
/// - ポリゴン内部をスキャンライン方式で効率的に判定
/// - Point-in-polygon アルゴリズムによる正確な内部判定
/// - バウンディングボックスによる計算範囲の最適化
/// - メモリ効率的な実装
#[wasm_bindgen]
pub fn fill_lasso_selection(
    mask: &mut [u8],
    width: u32,
    height: u32,
    points: &[f32], // [x1, y1, x2, y2, ...]
) -> bool {
    let width = width as usize;
    let height = height as usize;

    if points.len() < 6 || points.len() % 2 != 0 {
        return false; // 最低3点必要
    }

    // ポリゴンの点を構築
    let polygon: Vec<(f32, f32)> = points
        .chunks_exact(2)
        .map(|chunk| (chunk[0], chunk[1]))
        .collect();

    // バウンディングボックスを計算
    let (min_x, max_x, min_y, max_y) = calculate_bounds(&polygon);

    // 計算範囲を画像境界内に制限
    let start_x = (min_x.floor() as usize).saturating_sub(1).min(width);
    let end_x = ((max_x.ceil() as usize) + 2).min(width);
    let start_y = (min_y.floor() as usize).saturating_sub(1).min(height);
    let end_y = ((max_y.ceil() as usize) + 2).min(height);

    // スキャンライン方式でポリゴン内部を塗りつぶし
    for y in start_y..end_y {
        let intersections = find_intersections(&polygon, y as f32);
        fill_scanline_mask(mask, width, y, &intersections, start_x, end_x);
    }

    true
}

/// 選択範囲制限付きLasso選択
#[wasm_bindgen]
pub fn fill_lasso_selection_with_mask(
    mask: &mut [u8],
    width: u32,
    height: u32,
    points: &[f32],
    existing_mask: &[u8],
    limit_mode: &str, // "inside", "outside", "none"
) -> bool {
    let width = width as usize;
    let height = height as usize;

    if points.len() < 6 || points.len() % 2 != 0 {
        return false;
    }

    let polygon: Vec<(f32, f32)> = points
        .chunks_exact(2)
        .map(|chunk| (chunk[0], chunk[1]))
        .collect();

    let (min_x, max_x, min_y, max_y) = calculate_bounds(&polygon);

    let start_x = (min_x.floor() as usize).saturating_sub(1).min(width);
    let end_x = ((max_x.ceil() as usize) + 2).min(width);
    let start_y = (min_y.floor() as usize).saturating_sub(1).min(height);
    let end_y = ((max_y.ceil() as usize) + 2).min(height);

    // 選択範囲制限チェック関数
    let is_allowed = |x: usize, y: usize| -> bool {
        let mask_index = y * width + x;
        if mask_index >= existing_mask.len() {
            return false;
        }
        let is_in_selection = existing_mask[mask_index] > 0;

        match limit_mode {
            "inside" => is_in_selection,
            "outside" => !is_in_selection,
            _ => true,
        }
    };

    for y in start_y..end_y {
        let intersections = find_intersections(&polygon, y as f32);
        fill_scanline_mask_with_limit(mask, width, y, &intersections, start_x, end_x, &is_allowed);
    }

    true
}

/// Point-in-polygon アルゴリズムを使用した直接的な実装（小さなポリゴン用）
#[wasm_bindgen]
pub fn fill_lasso_selection_point_in_polygon(
    mask: &mut [u8],
    width: u32,
    height: u32,
    points: &[f32],
) -> bool {
    let width = width as usize;
    let height = height as usize;

    if points.len() < 6 || points.len() % 2 != 0 {
        return false;
    }

    let polygon: Vec<(f32, f32)> = points
        .chunks_exact(2)
        .map(|chunk| (chunk[0], chunk[1]))
        .collect();

    let (min_x, max_x, min_y, max_y) = calculate_bounds(&polygon);

    let start_x = (min_x.floor() as usize).saturating_sub(1).min(width);
    let end_x = ((max_x.ceil() as usize) + 2).min(width);
    let start_y = (min_y.floor() as usize).saturating_sub(1).min(height);
    let end_y = ((max_y.ceil() as usize) + 2).min(height);

    for y in start_y..end_y {
        for x in start_x..end_x {
            if point_in_polygon(x as f32 + 0.5, y as f32 + 0.5, &polygon) {
                mask[y * width + x] = 255;
            }
        }
    }

    true
}

/// ポリゴンのバウンディングボックスを計算
fn calculate_bounds(polygon: &[(f32, f32)]) -> (f32, f32, f32, f32) {
    let mut min_x = f32::INFINITY;
    let mut max_x = f32::NEG_INFINITY;
    let mut min_y = f32::INFINITY;
    let mut max_y = f32::NEG_INFINITY;

    for &(x, y) in polygon {
        min_x = min_x.min(x);
        max_x = max_x.max(x);
        min_y = min_y.min(y);
        max_y = max_y.max(y);
    }

    (min_x, max_x, min_y, max_y)
}

/// 指定したY座標でポリゴンの辺との交点を見つける
fn find_intersections(polygon: &[(f32, f32)], y: f32) -> Vec<f32> {
    let mut intersections = Vec::new();
    let n = polygon.len();

    for i in 0..n {
        let j = (i + 1) % n;
        let (x1, y1) = polygon[i];
        let (x2, y2) = polygon[j];

        // 水平線との交点を計算
        if (y1 <= y && y < y2) || (y2 <= y && y < y1) {
            if (y2 - y1).abs() > f32::EPSILON {
                let x = x1 + (y - y1) * (x2 - x1) / (y2 - y1);
                intersections.push(x);
            }
        }
    }

    // 交点をソート
    intersections.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    intersections
}

/// スキャンラインを使ってマスクを塗りつぶす
fn fill_scanline_mask(
    mask: &mut [u8],
    width: usize,
    y: usize,
    intersections: &[f32],
    start_x: usize,
    end_x: usize,
) {
    // 交点をペアにして塗りつぶし
    for chunk in intersections.chunks_exact(2) {
        let left = (chunk[0].floor() as usize).max(start_x).min(width);
        let right = (chunk[1].ceil() as usize)
            .max(start_x)
            .min(end_x)
            .min(width);

        for x in left..right {
            if x < width {
                mask[y * width + x] = 255;
            }
        }
    }
}

/// 制限付きスキャンライン塗りつぶし
fn fill_scanline_mask_with_limit<F>(
    mask: &mut [u8],
    width: usize,
    y: usize,
    intersections: &[f32],
    start_x: usize,
    end_x: usize,
    is_allowed: &F,
) where
    F: Fn(usize, usize) -> bool,
{
    for chunk in intersections.chunks_exact(2) {
        let left = (chunk[0].floor() as usize).max(start_x).min(width);
        let right = (chunk[1].ceil() as usize)
            .max(start_x)
            .min(end_x)
            .min(width);

        for x in left..right {
            if x < width && is_allowed(x, y) {
                mask[y * width + x] = 255;
            }
        }
    }
}

/// Point-in-polygon判定（Ray casting algorithm）
fn point_in_polygon(x: f32, y: f32, polygon: &[(f32, f32)]) -> bool {
    let mut inside = false;
    let n = polygon.len();

    let mut j = n - 1;
    for i in 0..n {
        let (xi, yi) = polygon[i];
        let (xj, yj) = polygon[j];

        if ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
        j = i;
    }
    inside
}
