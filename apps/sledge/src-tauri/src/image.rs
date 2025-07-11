use image::ImageReader;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageData {
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "width")]
    pub width: u32,
    #[serde(rename = "height")]
    pub height: u32,
    #[serde(rename = "buffer")]
    pub buffer: Vec<u8>,
}

pub fn load_image_data(image_file_path: &str) -> Result<ImageData, String> {
    let file_name = std::path::Path::new(image_file_path)
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| "Invalid image file path".to_string())?;
    let image = ImageReader::open(image_file_path)
        .map_err(|e| format!("Failed to open image: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let rgba_image = image.to_rgba8();
    let data = ImageData {
        file_name: file_name.to_string(),
        width: image.width(),
        height: image.height(),
        buffer: rgba_image.into_raw(),
    };

    Ok(data)
}
