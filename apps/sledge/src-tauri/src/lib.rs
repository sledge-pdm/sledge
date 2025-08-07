mod analysis;
mod global_event;
mod splash;
mod window;

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_fs::FsExt;
use window::{SledgeWindowKind, WindowOpenOptions};

fn handle_file_associations(app: AppHandle, files: Vec<PathBuf>) {
    println!("handle_file_associations called with {} files", files.len());
    // This requires the `fs` tauri plugin and is required to make the plugin's frontend work:
    // use tauri_plugin_fs::FsExt;
    let fs_scope = app.fs_scope();

    // This is for the `asset:` protocol to work:
    let asset_protocol_scope = app.asset_protocol_scope();

    if files.is_empty() {
        println!("No files, opening editor window");
        // Tokioランタイムを作成して非同期関数を実行
        let rt = tokio::runtime::Runtime::new().unwrap();
        let future_open = window::open_window(
            app,
            SledgeWindowKind::Editor,
            Some(WindowOpenOptions {
                query: None,
                initialization_script: None,
                open_path: None,
            }),
        );
        let result = rt.block_on(future_open);
        println!("Window open result: {:?}", result);
        return;
    }

    for file in &files {
        // This requires the `fs` plugin:
        let _ = fs_scope.allow_file(file);

        // This is for the `asset:` protocol:
        let _ = asset_protocol_scope.allow_file(file);

        // Tokioランタイムを作成して非同期関数を実行
        let rt = tokio::runtime::Runtime::new().unwrap();
        let future_open = window::open_window(
            app.clone(),
            SledgeWindowKind::Editor,
            Some(WindowOpenOptions {
                query: None,
                initialization_script: None,
                open_path: Some(file.to_string_lossy().into_owned()),
            }),
        );
        let _ = rt.block_on(future_open);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            analysis::get_process_memory,
            window::open_window,
            window::show_main_window,
            global_event::emit_global_event,
        ])
        .plugin(
            tauri_plugin_log::Builder::new()
                .level_for("eframe", log::LevelFilter::Warn)
                .level_for("egui", log::LevelFilter::Warn)
                .level_for("egui_glow", log::LevelFilter::Warn)
                .level_for("egui_winit", log::LevelFilter::Warn)
                .level_for("tao", log::LevelFilter::Error)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_opener::init());

    builder
        .setup(
            #[allow(unused_variables)]
            |app| {
                println!("Tauri setup started");

                #[allow(unused_mut)]
                let mut files = Vec::new();

                // NOTICE: `args` may include URL protocol (`your-app-protocol://`)
                // or arguments (`--`) if your app supports them.
                // files may aslo be passed as `file://path/to/file`

                #[cfg(not(target_os = "macos"))]
                {
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
                }

                // macOSでも初期ウィンドウを開く
                println!("About to handle file associations");
                handle_file_associations(app.handle().clone(), files);
                println!("Setup completed");
                Ok(())
            },
        )
        // you can replace the following for the default stuff if you don't need macos/ios support
        .build(tauri::generate_context!())
        .expect("error building tauri application")
        .run(
            #[allow(unused_variables)]
            |app, event| {
                #[cfg(any(target_os = "macos", target_os = "ios"))]
                if let tauri::RunEvent::Opened { urls } = event {
                    let files = urls
                        .into_iter()
                        .filter_map(|url| url.to_file_path().ok())
                        .collect::<Vec<_>>();

                    handle_file_associations(app.clone(), files);
                }
            },
        );
}
