mod analysis;
mod commands;
mod window;

use analysis::get_process_memory;
use commands::emit_global_event;
use window::{OpenWindowPayload, SledgeWindowKind, open_window};

use futures::executor::block_on;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_process_memory,
            open_window,
            emit_global_event
        ])
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_system_info::init());

    builder
        .setup(|app| {
            let app_handle = app.handle().clone();
            let future_open = open_window(
                app_handle,
                OpenWindowPayload {
                    kind: SledgeWindowKind::Editor,
                    query: None,
                },
            );
            let _ = block_on(future_open);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
