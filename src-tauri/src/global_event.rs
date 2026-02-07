use serde_json::Value;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn emit_global_event(app: AppHandle, event: String, msg: Option<Value>) -> Result<(), String> {
    let payload = msg.unwrap_or_else(|| serde_json::json!({}));
    app.emit(&event, payload).map_err(|e| e.to_string())
}
