use crate::commands::base64_utils::{decode_image_base64, encode_image_base64};

#[tauri::command]
pub fn brightness(
    encoded: String,
    width: usize,
    height: usize,
    delta: i8,
) -> Result<String, String> {
    let mut data = decode_image_base64(&encoded)?;

    for i in (0..data.len()).step_by(4) {
        data[i] = data[i].saturating_add_signed(delta);
        data[i + 1] = data[i + 1].saturating_add_signed(delta);
        data[i + 2] = data[i + 2].saturating_add_signed(delta);
    }

    encode_image_base64(&data)
}
