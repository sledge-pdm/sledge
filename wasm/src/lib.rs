use wasm_bindgen::prelude::*;

pub mod fill;
pub mod selection;
pub mod utils;
pub mod webgl;

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
