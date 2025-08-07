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

// const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-extensions --disable-plugins --disable-dev-shm-usage";

const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection";

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
    println!("open_window called with kind: {:?}", kind);
    // let splash_closer = Some(splash::show_splash_screen());

    let open_path = options.as_ref().and_then(|opts| opts.open_path.clone());

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

    // 1. 開く先の `label` を決定
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
                .closable(true)
                .skip_taskbar(true)
                .minimizable(false)
                .maximizable(false);
        }
        SledgeWindowKind::Settings => {
            builder = builder
                .title("settings.")
                .inner_size(600.0, 400.0)
                .resizable(false)
                .closable(true)
                .skip_taskbar(true)
                .minimizable(false)
                .maximizable(false);
        }
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
        // window.set_focus().map_err(|e| e.to_string())?;
    }

    Ok(())
}
