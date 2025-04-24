use crate::commands::{decode_image_base64, encode_image_base64};

#[tauri::command]
pub fn flood_fill(
    encoded: String,
    width: usize,
    height: usize,
    x: usize,
    y: usize,
    new_color: [u8; 4],
) -> Result<String, String> {
    let mut image = decode_image_base64(&encoded)?;

    let mut visited = vec![false; width * height];
    let mut stack = Vec::with_capacity(4096);

    let idx = |x, y| (y * width + x) * 4;

    // ここで事前にターゲット色をコピー（借用を解決）
    let ti = idx(x, y);
    let target = [image[ti], image[ti + 1], image[ti + 2], image[ti + 3]];

    if target == new_color {
        return encode_image_base64(&image);
    }

    stack.push((x, y));
    while let Some((cx, cy)) = stack.pop() {
        if cx >= width || cy >= height {
            continue;
        }
        let i = idx(cx, cy);
        if visited[cy * width + cx] {
            continue;
        }
        if image[i..i + 4] != target {
            continue;
        }

        image[i..i + 4].copy_from_slice(&new_color);
        visited[cy * width + cx] = true;

        if cx + 1 < width {
            stack.push((cx + 1, cy));
        }
        if cx >= 1 {
            stack.push((cx - 1, cy));
        }
        if cy + 1 < height {
            stack.push((cx, cy + 1));
        }
        if cy >= 1 {
            stack.push((cx, cy - 1));
        }
    }

    encode_image_base64(&image)
}
