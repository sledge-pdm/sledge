pub mod base64_utils;

pub mod grayscale;
pub use grayscale::grayscale;

pub mod invert;
pub use invert::invert;

pub mod sepia;
pub use sepia::sepia;

// デバッグ用など
#[tauri::command]
pub fn hello_from_rust(name: String) -> String {
    format!("Hello, {name}! This is Rust talking.")
}
