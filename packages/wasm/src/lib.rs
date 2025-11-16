use wasm_bindgen::prelude::*;

// WebGL関連
pub mod webgl;
// 選択範囲関連
pub mod selection;
// ユーティリティ
pub mod utils;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
#[allow(clippy::crate_in_macro_def)]
macro_rules! console_log {
    ($($t:tt)*) => (crate::log(&format_args!($($t)*).to_string()))
}
