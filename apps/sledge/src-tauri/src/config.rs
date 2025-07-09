use serde_json::Value;
use std::fs;
use tauri::{AppHandle, Manager};

use crate::global_event::emit_global_event;

const CONFIG_FILE_NAME: &str = "global.sledgeconfig";

#[tauri::command]
pub async fn load_global_config(app: AppHandle) -> Result<Value, String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config directory: {}", e))?;

    let config_path = app_config_dir.join(CONFIG_FILE_NAME);

    if !config_path.exists() {
        // ファイルが存在しない場合は空のJSONオブジェクトを返す
        return Ok(Value::Object(Default::default()));
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    let json: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config JSON: {}", e))?;

    Ok(json)
}

#[tauri::command]
pub async fn save_global_config(app: AppHandle, config: Value) -> Result<(), String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config directory: {}", e))?;

    // ディレクトリを作成（存在しない場合）
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_path = app_config_dir.join(CONFIG_FILE_NAME);

    let json_string = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, json_string)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    let _ = emit_global_event(app, "onSettingsSaved".to_string(), Some(config));

    Ok(())
}

#[tauri::command]
pub async fn reset_global_config(app: AppHandle) -> Result<(), String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config directory: {}", e))?;

    let config_path = app_config_dir.join(CONFIG_FILE_NAME);

    if config_path.exists() {
        fs::remove_file(&config_path)
            .map_err(|e| format!("Failed to delete config file: {}", e))?;
    }

    Ok(())
}
