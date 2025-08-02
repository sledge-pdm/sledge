use base64::{Engine, engine::general_purpose};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    #[serde(rename = "canvasStore")]
    pub canvas_store: CanvasStore,
    #[serde(rename = "projectStore")]
    pub project_store: ProjectStore,
    #[serde(rename = "imagePoolStore")]
    pub image_pool_store: ImagePoolStore,
    #[serde(rename = "layerListStore")]
    pub layer_list_store: LayerListStore,
    #[serde(rename = "layerBuffers")]
    pub layer_buffers: HashMap<String, Vec<u8>>, // Uint8ClampedArray -> Vec<u8>
}

// msgpackrの設定に合わせて、より柔軟なデシリアライズを試す
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FlexibleProject {
    Standard(Project),
    Raw(serde_json::Value),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasStore {
    pub canvas: Size2D,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Size2D {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStore {
    #[serde(rename = "thumbnailPath")]
    pub thumbnail_path: Option<String>,
    #[serde(rename = "isProjectChangedAfterSave")]
    pub is_project_changed_after_save: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImagePoolStore {
    pub entries: HashMap<String, ImagePoolEntry>, // ReactiveMap -> HashMap
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImagePoolEntry {
    pub id: String,
    #[serde(rename = "originalPath")]
    pub original_path: String,
    #[serde(rename = "resourcePath")]
    pub resource_path: String,
    pub x: f64,
    pub y: f64,
    pub scale: f64,
    pub width: f64,
    pub height: f64,
    pub opacity: f64,
    pub visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerListStore {
    pub layers: Vec<Layer>,
    #[serde(rename = "activeLayerId")]
    pub active_layer_id: String,
    #[serde(rename = "isImagePoolActive")]
    pub is_image_pool_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub layer_type: LayerType,
    #[serde(rename = "typeDescription")]
    pub type_description: String,
    pub enabled: bool,
    pub opacity: f64,
    pub mode: BlendMode,
    #[serde(rename = "dotMagnification")]
    pub dot_magnification: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LayerType {
    Dot,
    Image,
    Automate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlendMode {
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "multiply")]
    Multiply,
}

// バイナリファイルをbase64として送信する簡単な方法（同期版）
pub fn load_project_as_base64_sync(file_path: &str) -> Result<String, String> {
    let path = Path::new(file_path);

    // msgpackファイルを読み込み
    let project_data =
        std::fs::read(path).map_err(|e| format!("Failed to read project file: {}", e))?;

    println!("Project file size: {} bytes", project_data.len());

    // base64エンコード（新しいAPI）
    let encoded = general_purpose::STANDARD.encode(&project_data);

    println!("Encoded to base64, length: {} chars", encoded.len());

    Ok(encoded)
}

// バイナリファイルをbase64として送信する簡単な方法（非同期版）
pub async fn load_project_as_base64(file_path: &str) -> Result<String, String> {
    let path = Path::new(file_path);

    // msgpackファイルを読み込み
    let project_data = tokio::fs::read(path)
        .await
        .map_err(|e| format!("Failed to read project file: {}", e))?;

    println!("Project file size: {} bytes", project_data.len());

    // base64エンコード（新しいAPI）
    let encoded = general_purpose::STANDARD.encode(&project_data);

    println!("Encoded to base64, length: {} chars", encoded.len());

    Ok(encoded)
}

// 同期版のプロジェクト読み込み関数
pub fn load_project_complete_internal_sync(file_path: &str) -> Result<serde_json::Value, String> {
    // msgpackの解析が困難なので、base64として送信
    let base64_data = load_project_as_base64_sync(file_path)?;

    // base64データをJSONオブジェクトとして返す
    Ok(serde_json::json!({
        "type": "base64_msgpack",
        "data": base64_data,
        "file_path": file_path
    }))
}

// 非同期版のプロジェクト読み込み関数
pub async fn load_project_complete_internal(file_path: &str) -> Result<serde_json::Value, String> {
    // msgpackの解析が困難なので、base64として送信
    let base64_data = load_project_as_base64(file_path).await?;

    // base64データをJSONオブジェクトとして返す
    Ok(serde_json::json!({
        "type": "base64_msgpack",
        "data": base64_data,
        "file_path": file_path
    }))
}

// Tauriコマンド：初期状態で呼び出される可能性がある場合の対応
#[tauri::command]
pub fn load_project_complete_sync(file_path: String) -> Result<serde_json::Value, String> {
    load_project_complete_internal_sync(&file_path)
}

// Tauriコマンド：非同期版（既存）
#[tauri::command]
pub async fn load_project_complete(file_path: String) -> Result<serde_json::Value, String> {
    load_project_complete_internal(&file_path).await
}
