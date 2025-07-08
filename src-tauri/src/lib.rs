mod analysis;
mod config;
mod global_event;
mod splash;
mod window;

use window::SledgeWindowKind;

use futures::executor::block_on;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            analysis::get_process_memory,
            window::open_window,
            window::show_main_window,
            global_event::emit_global_event,
            config::load_global_config,
            config::save_global_config,
            config::reset_global_config
        ])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_opener::init());

    builder
        .setup(|app| {
            let app_handle = app.handle().clone();
            let future_open = window::open_window(app_handle, SledgeWindowKind::Editor, None);
            let _ = block_on(future_open);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
