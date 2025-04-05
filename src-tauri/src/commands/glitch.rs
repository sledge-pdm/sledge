use crate::commands::base64_utils::{decode_image_base64, encode_image_base64};
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};

#[tauri::command]
pub fn glitch(encoded: String, seed: u64) -> Result<String, String> {
    let mut data = decode_image_base64(&encoded)?;

    // 乱数生成器の初期化
    let mut rng = StdRng::seed_from_u64(seed);

    // 64バイトぶん、ランダム位置を破壊（数は調整可）
    for _ in 0..64 {
        let idx = rng.random_range(0..data.len());
        data[idx] = rng.random();
    }

    encode_image_base64(&data)
}
