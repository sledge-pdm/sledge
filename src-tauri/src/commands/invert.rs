pub fn invert(mut data: Vec<u8>) -> Result<Vec<u8>, String> {
    for i in (0..data.len()).step_by(4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
        // alphaはそのまま
    }
    Ok(data)
}
