use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;

use uuid::Uuid;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum SledgeWindowKind {
    Start,
    Editor,
    About,
    Settings,
}

const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-extensions --disable-plugins --disable-dev-shm-usage";

// const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection";

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
    pub parent: Option<String>,
}

#[tauri::command]
pub async fn open_window(
    app: AppHandle,
    kind: SledgeWindowKind,
    options: Option<WindowOpenOptions>,
) -> Result<(), String> {
    println!("open_window called with kind: {:?}", kind);

    let open_path = options.as_ref().and_then(|opts| opts.open_path.clone());
    let parent = options.as_ref().and_then(|opts| opts.parent.clone());

    let path_script = format!(
        "window.__PATH__={};",
        serde_json::to_string(&open_path.unwrap_or_default()).unwrap_or_default()
    );

    let custom_script = options
        .as_ref()
        .and_then(|opts| opts.initialization_script.as_ref())
        .cloned()
        .unwrap_or_default();

    let initialization_script = format!("{}{}", path_script, custom_script);

    let query = options
        .as_ref()
        .and_then(|opts| opts.query.as_ref())
        .cloned();

    let (label, url) = match kind {
        SledgeWindowKind::Start => ("start".into(), "/start".into()),
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

    // reuse if there's same window
    if let Some(existing) = app.get_webview_window(&label) {
        // ウィンドウを最前面に表示
        existing.show().map_err(|e| e.to_string())?;
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(url.into()))
        .additional_browser_args(COMMON_BROWSER_ARGS)
        .initialization_script(initialization_script);

    let window_inner_width: f64;
    let window_inner_height: f64;
    match kind {
        SledgeWindowKind::Start => {
            window_inner_width = 500.0;
            window_inner_height = 400.0;
            builder = builder
                .title("sledge.")
                .resizable(false)
                .accept_first_mouse(true)
                .closable(true)
                .maximizable(true)
                .minimizable(true);
        }
        SledgeWindowKind::Editor => {
            window_inner_width = 1200.0;
            window_inner_height = 750.0;
            builder = builder
                .title("sledge.")
                .resizable(true)
                .accept_first_mouse(true)
                .closable(true)
                .maximizable(true)
                .minimizable(true);
        }
        SledgeWindowKind::About => {
            window_inner_width = 380.0;
            window_inner_height = 270.0;
            builder = builder
                .title("about.")
                .resizable(false)
                .closable(true)
                .minimizable(false)
                .maximizable(false);
        }
        SledgeWindowKind::Settings => {
            window_inner_width = 650.0;
            window_inner_height = 500.0;
            builder = builder
                .title("settings.")
                .resizable(false)
                .closable(true)
                .minimizable(false)
                .maximizable(false);
        }
    }

    builder = builder.inner_size(window_inner_width, window_inner_height);

    if let Some(parent) = parent {
        if let Some(parent_window) = app.get_webview_window(&parent) {
            builder = builder.parent(&parent_window).map_err(|e| e.to_string())?;

            let scale_factor = parent_window.scale_factor().unwrap_or(1.0);

            // Physical positionとPhysical sizeを使用して正確な位置を計算
            let parent_position = parent_window.inner_position().unwrap_or_default();
            let parent_size = parent_window.inner_size().unwrap_or_default();

            // Physical coordinatesでの中央位置計算
            let parent_center_x = parent_position.x as f64 + (parent_size.width as f64) / 2.0;
            let parent_center_y = parent_position.y as f64 + (parent_size.height as f64) / 2.0;

            // 子ウィンドウのサイズ
            let child_physical_width = window_inner_width;
            let child_physical_height = window_inner_height;

            // Physical座標で計算してからLogical座標に変換
            let physical_px = parent_center_x - child_physical_width * scale_factor / 2.0;
            let physical_py = parent_center_y - child_physical_height * scale_factor / 2.0;

            // Logical座標に変換（position()メソッドはLogical座標を期待）
            let px = physical_px / scale_factor;
            let py = physical_py / scale_factor;
            builder = builder.position(px, py);
        }
    } else {
        builder = builder.center();
    }

    #[cfg(target_os = "windows")]
    {
        builder = builder.decorations(false);
    }

    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(TitleBarStyle::Transparent);
    }

    // 4. ウィンドウ生成（非表示で）
    #[allow(unused_variables)]
    let window = builder
        .visible(false) // App.tsx側でshowするまでは非表示
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn show_main_window(app: AppHandle, window_label: String) -> Result<(), String> {
    // メインウィンドウを表示
    if let Some(window) = app.get_webview_window(&window_label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_devtools_window(app: AppHandle, window_label: String) -> Result<(), String> {
    // devToolsを表示
    #[allow(unused_variables)]
    if let Some(window) = app.get_webview_window(&window_label) {
        #[cfg(debug_assertions)]
        window.open_devtools();
    }

    Ok(())
}
