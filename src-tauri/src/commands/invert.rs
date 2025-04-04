use crate::commands::base64_utils::{decode_image_base64, encode_image_base64};

#[tauri::command]
pub fn invert(encoded: String, width: usize, height: usize) -> Result<String, String> {
    let mut decoded = decode_image_base64(&encoded)?;

    for i in (0..decoded.len()).step_by(4) {
        decoded[i] = 255 - decoded[i];
        decoded[i + 1] = 255 - decoded[i + 1];
        decoded[i + 2] = 255 - decoded[i + 2];
        // alphaはそのまま
    }

    encode_image_base64(&decoded)
}
