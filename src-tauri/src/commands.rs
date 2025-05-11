use serde_json::Value;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn emit_global_event(app: AppHandle, event: String, _msg: Option<Value>) -> Result<(), String> {
    // ペイロードは何も要らないので空オブジェクトを送る
    let payload = serde_json::json!({});
    app.emit(&event, payload).map_err(|e| e.to_string())
}
