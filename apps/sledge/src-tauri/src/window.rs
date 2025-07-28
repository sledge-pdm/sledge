use crate::config;
use crate::image;
use crate::project;
use crate::splash;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SledgeWindowKind {
    Start,
    Editor,
    About,
    Settings,
}

const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-extensions --disable-plugins --disable-dev-shm-usage";

fn next_editor_label(app: &AppHandle) -> String {
    loop {
        let label = format!(
            "editor-{}",
            Uuid::new_v4().simple().to_string()[..8].to_owned()
        );
        if app.get_webview_window(&label).is_none() {
            return label;
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct WindowOpenOptions {
    pub query: Option<String>,
    pub initialization_script: Option<String>,
    pub open_path: Option<String>,
}

#[tauri::command]
pub async fn open_window(
    app: AppHandle,
    kind: SledgeWindowKind,
    options: Option<WindowOpenOptions>,
) -> Result<(), String> {
    // 1. スプラッシュスクリーンを即座に表示
    let splash_closer = if matches!(kind, SledgeWindowKind::Start | SledgeWindowKind::Editor) {
        Some(splash::show_splash_screen())
    } else {
        None
    };

    // 2. 設定読み込み
    let config = match config::load_global_config(app.clone()).await {
        Ok(config) => {
            // println!("Loaded global config: {:?}", config);
            config
        }
        Err(e) => {
            eprintln!("Failed to load global config: {}", e);
            // エラー時は空のJSONオブジェクトを使用
            serde_json::Value::Object(Default::default())
        }
    };

    // 3. プロジェクトデータ読み込み（エディターかつopen_pathがある場合）
    let project_data = options
        .as_ref()
        .and_then(|opts| opts.open_path.as_ref())
        .filter(|open_path| open_path.ends_with(".sledge"))
        .and_then(|open_path| {
            println!("Loading project from: {}", open_path);
            project::load_project_complete_internal_sync(open_path).ok()
        });
    // 3. プロジェクトデータ読み込み（エディターかつopen_pathがある場合）
    let image_data = options
        .as_ref()
        .and_then(|opts| opts.open_path.as_ref())
        .filter(|open_path| {
            open_path.ends_with(".png")
                || open_path.ends_with(".jpg")
                || open_path.ends_with(".jpeg")
        })
        .and_then(|open_path| {
            println!("Loading Image from: {}", open_path);
            match image::load_image_data(open_path) {
                Ok(data) => Some(data),
                Err(e) => {
                    eprintln!("Failed to load project: {}", e);
                    None
                }
            }
        });

    // 5. initialization_script構築
    let config_script = format!(
        "window.__CONFIG__={};",
        serde_json::to_string(&config).unwrap_or_default()
    );
    let project_script = if let Some(project) = project_data {
        format!(
            "window.__PROJECT__={};",
            serde_json::to_string(&project).unwrap_or_default()
        )
    } else {
        String::new()
    };
    let image_data_script = if let Some(project) = image_data {
        format!(
            "window.__IMAGE__={};",
            serde_json::to_string(&project).unwrap_or_default()
        )
    } else {
        String::new()
    };

    let custom_script = options
        .as_ref()
        .and_then(|opts| opts.initialization_script.as_ref())
        .cloned()
        .unwrap_or_default();

    let initialization_script = format!(
        "{}{}{}{}",
        config_script, project_script, image_data_script, custom_script
    );

    // 6. クエリパラメータの生成（必要に応じて）
    let query = options
        .as_ref()
        .and_then(|opts| opts.query.as_ref())
        .cloned();

    // 1. 開く先の `label` を決定
    let (label, url) = match kind {
        SledgeWindowKind::Start => ("start".into(), "/".into()),
        SledgeWindowKind::About => ("about".into(), "/about".into()),
        SledgeWindowKind::Settings => ("settings".into(), "/settings".into()),
        SledgeWindowKind::Editor => {
            let lbl = next_editor_label(&app);
            let base = "/editor";
            let full = query
                .as_ref()
                .map(|q| format!("{base}?{q}"))
                .unwrap_or_else(|| base.to_string());
            (lbl, full)
        }
    };
    // 2. 既存ウィンドウがあれば再利用
    if let Some(existing) = app.get_webview_window(&label) {
        // ウィンドウを最前面に表示
        existing.show().map_err(|e| e.to_string())?;
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // 3. 新規ビルダー作成
    let mut builder = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(url.into()))
        .additional_browser_args(COMMON_BROWSER_ARGS)
        .initialization_script(initialization_script);

    // 各種設定（サイズや装飾など）をここで上書き
    match kind {
        SledgeWindowKind::Start => {
            builder = builder
                .title("sledge.")
                .inner_size(500.0, 400.0)
                .resizable(false)
                .decorations(false)
                .accept_first_mouse(true)
                .closable(true)
                .maximizable(true)
                .minimizable(true);
        }
        SledgeWindowKind::Editor => {
            builder = builder
                .title("sledge.")
                .inner_size(1200.0, 750.0)
                .resizable(true)
                .decorations(false)
                .accept_first_mouse(true)
                .closable(true)
                .maximizable(true)
                .minimizable(true);
        }
        SledgeWindowKind::About => {
            builder = builder
                .title("about.")
                .inner_size(400.0, 280.0)
                .resizable(false)
                .decorations(false)
                .closable(true)
                .skip_taskbar(true)
                .always_on_top(true)
                .minimizable(false)
                .maximizable(false);
        }
        SledgeWindowKind::Settings => {
            builder = builder
                .title("settings.")
                .inner_size(600.0, 400.0)
                .resizable(false)
                .decorations(false)
                .closable(true)
                .skip_taskbar(true)
                .always_on_top(true)
                .minimizable(false)
                .maximizable(false);
        }
    }

    // 4. ウィンドウ生成（非表示で）
    let _window = builder
        .visible(false) // App.tsx側でshowするまでは非表示
        .build()
        .map_err(|e| e.to_string())?;

    // スプラッシュクローザーをアプリの状態として保存
    if let Some(closer) = splash_closer {
        app.manage(closer);
    }

    Ok(())
}

#[tauri::command]
pub async fn show_main_window(app: AppHandle, window_label: String) -> Result<(), String> {
    // スプラッシュスクリーンを閉じる
    if let Some(splash_closer) = app.try_state::<Arc<AtomicBool>>() {
        splash::close_splash_screen(splash_closer.inner().clone());
        // 少し待ってからメインウィンドウを表示
        // tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }

    // メインウィンドウを表示
    if let Some(window) = app.get_webview_window(&window_label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}
