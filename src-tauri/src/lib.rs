use base64::Engine;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![hello_from_rust])
        .invoke_handler(tauri::generate_handler![process_image_base64])
        .invoke_handler(tauri::generate_handler![invert])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn hello_from_rust(name: String) -> String {
    format!("Hello, {name}! This is Rust talking.")
}

#[tauri::command]
fn process_image_base64(encoded: String, width: usize, height: usize) -> Result<String, String> {
    let decoded = base64::prelude::BASE64_STANDARD
        .decode(&encoded)
        .map_err(|e| e.to_string())?;

    let pixel_count = decoded.len() / 4;

    if pixel_count != width * height {
        return Err(format!(
            "不一致: {}ピクセル (期待値: {}x{}={})",
            pixel_count,
            width,
            height,
            width * height
        ));
    }

    Ok(format!(
        "処理完了: {}バイト, {}ピクセル {}x{}",
        decoded.len(),
        pixel_count,
        width,
        height
    ))
}

#[tauri::command]
fn invert(encoded: String, width: usize, height: usize) -> Result<String, String> {
    let mut decoded = base64::prelude::BASE64_STANDARD
        .decode(&encoded)
        .map_err(|e| e.to_string())?;

    for i in (0..decoded.len()).step_by(4) {
        decoded[i] = 255 - decoded[i]; // R
        decoded[i + 1] = 255 - decoded[i + 1]; // G
        decoded[i + 2] = 255 - decoded[i + 2]; // B
                                               // Aはそのまま
    }

    // 返す
    let re_encoded = base64::prelude::BASE64_STANDARD.encode(&decoded);
    Ok(re_encoded)
}
