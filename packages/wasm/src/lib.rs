use wasm_bindgen::prelude::*;

// エフェクト
pub mod effects;
// WebGL関連
pub mod webgl;
// 選択範囲関連
pub mod selection;
// ユーティリティ
pub mod utils;
// FloodFill関連
pub mod fill;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (crate::log(&format_args!($($t)*).to_string()))
}