use std::path::Path;

use tauri::image::Image;

pub fn load_image_buffer(image_file_path: &str) -> Result<Vec<u8>, ()> {
    let path = Path::new(image_file_path);

    let image = Image::from_path(path).map_err(|_| ())?;

    let buffer = image.rgba();

    Ok(buffer.to_vec())
}
