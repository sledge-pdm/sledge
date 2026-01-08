pub mod area_fill;
pub mod flood_fill;

/// 色の類似性判定（threshold付き）
fn colors_match(color1: &[u8; 4], color2: &[u8; 4], threshold: u8) -> bool {
    if threshold == 0 {
        color1 == color2
    } else {
        let diff_r = (color1[0] as i16 - color2[0] as i16).abs();
        let diff_g = (color1[1] as i16 - color2[1] as i16).abs();
        let diff_b = (color1[2] as i16 - color2[2] as i16).abs();
        // let diff_a = (color1[3] as i16 - color2[3] as i16).abs();

        diff_r <= threshold as i16 && diff_g <= threshold as i16 && diff_b <= threshold as i16
        // && diff_a <= threshold as i16
    }
}
