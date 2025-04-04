use base64::engine::general_purpose::STANDARD;
use base64::prelude::*;

pub fn decode_image_base64(encoded: &str) -> Result<Vec<u8>, String> {
    STANDARD.decode(encoded).map_err(|e| e.to_string())
}

pub fn encode_image_base64(data: &[u8]) -> Result<String, String> {
    Ok(STANDARD.encode(data))
}
