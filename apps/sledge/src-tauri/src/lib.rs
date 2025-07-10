mod analysis;
mod config;
mod global_event;
mod splash;
mod window;

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_fs::FsExt;
use window::SledgeWindowKind;

use futures::executor::block_on;

fn handle_file_associations(app: AppHandle, files: Vec<PathBuf>) {
    // This requires the `fs` tauri plugin and is required to make the plugin's frontend work:
    // use tauri_plugin_fs::FsExt;
    let fs_scope = app.fs_scope();

    // This is for the `asset:` protocol to work:
    let asset_protocol_scope = app.asset_protocol_scope();

    for file in &files {
        // This requires the `fs` plugin:
        let _ = fs_scope.allow_file(file);

        // This is for the `asset:` protocol:
        let _ = asset_protocol_scope.allow_file(file);
    }

    let files = files
        .into_iter()
        .map(|f| {
            let file = f.to_string_lossy().replace('\\', "\\\\"); // escape backslash
            format!("\"{file}\"",) // wrap in quotes for JS array
        })
        .collect::<Vec<_>>()
        .join(",");

    let future_open = window::open_window(
        app,
        SledgeWindowKind::Editor,
        None,
        format!("window.openedFiles = [{files}]").into(),
    );
    let _ = block_on(future_open);
}

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
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_opener::init());

    builder
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                let mut files = Vec::new();

                // NOTICE: `args` may include URL protocol (`your-app-protocol://`)
                // or arguments (`--`) if your app supports them.
                // files may aslo be passed as `file://path/to/file`

                for maybe_file in std::env::args().skip(1) {
                    // skip the first argument which is the executable path
                    // skip flags like -f or --flag
                    if maybe_file.starts_with('-') {
                        continue;
                    }

                    let raw_maybe_file = format!(r"{}", maybe_file);
                    // handle `file://` path urls and skip other urls
                    if let Ok(url) = url::Url::parse(&raw_maybe_file) {
                        if let Ok(path) = url.to_file_path() {
                            files.push(path);
                        } else {
                            files.push(PathBuf::from(&raw_maybe_file));
                        }
                    } else {
                        files.push(PathBuf::from(&raw_maybe_file))
                    }
                }
                handle_file_associations(app.handle().clone(), files);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
