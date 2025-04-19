pub fn brightness(mut data: Vec<u8>, delta: i8) -> Result<Vec<u8>, String> {
    for i in (0..data.len()).step_by(4) {
        data[i] = data[i].saturating_add_signed(delta);
        data[i + 1] = data[i + 1].saturating_add_signed(delta);
        data[i + 2] = data[i + 2].saturating_add_signed(delta);
    }
    Ok(data)
}
