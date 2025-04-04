use crate::commands::base64_utils::{decode_image_base64, encode_image_base64};

#[tauri::command]
pub fn grayscale(encoded: String, width: usize, height: usize) -> Result<String, String> {
    let mut data = decode_image_base64(&encoded)?;

    for i in (0..data.len()).step_by(4) {
        let r = data[i] as u16;
        let g = data[i + 1] as u16;
        let b = data[i + 2] as u16;
        let gray = ((r + g + b) / 3) as u8;
        // または perceptual: let gray = (0.299*r + 0.587*g + 0.114*b) as u8;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    encode_image_base64(&data)
}
