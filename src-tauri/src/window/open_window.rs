use serde::Deserialize;
use std::path::PathBuf;
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SledgeWindowKind {
    Start,
    Editor,
    About,
    Settings,
}

#[derive(Deserialize)]
pub struct OpenWindowPayload {
    pub kind: SledgeWindowKind,
    pub query: Option<String>, // e.g., "id=xyz123"
}

const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection";

#[tauri::command]
pub async fn open_window(app: AppHandle, payload: OpenWindowPayload) -> Result<(), String> {
    use SledgeWindowKind::*;

    let label;
    let (_url, mut builder) = match payload.kind {
        Start => {
            label = "start";
            let _url = "/";
            let builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::App(_url.into()))
                .title("sledge")
                .inner_size(700.0, 500.0)
                .resizable(false)
                .decorations(false)
                .accept_first_mouse(true)
                .closable(true)
                .maximizable(true)
                .minimizable(true);
            (_url, builder)
        }

        Editor => {
            label = "editor";
            let base_url = "/editor";
            let full_url = match &payload.query {
                Some(query) => format!("{base_url}?{query}"),
                None => base_url.to_string(),
            };
            let builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::App(full_url.into()))
                .inner_size(1200.0, 750.0)
                .resizable(true)
                .decorations(false)
                .accept_first_mouse(true)
                .closable(true)
                .maximizable(true)
                .minimizable(true);
            (base_url, builder)
        }

        About => {
            label = "about";
            let _url = "/about";
            let builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::App(_url.into()))
                .title("about")
                .inner_size(400.0, 290.0)
                .resizable(false)
                .decorations(false)
                .closable(true)
                .accept_first_mouse(true)
                .skip_taskbar(true)
                .always_on_top(true)
                .minimizable(false)
                .maximizable(false);
            (_url, builder)
        }

        Settings => {
            label = "settings";
            let _url = "/settings";
            let builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::App(_url.into()))
                .title("settings")
                .inner_size(600.0, 400.0)
                .resizable(false)
                .decorations(false)
                .closable(true)
                .accept_first_mouse(true)
                .skip_taskbar(true)
                .always_on_top(true)
                .minimizable(false)
                .maximizable(false);
            (_url, builder)
        }
    };

    // data_directory をラベルごとに分けたいならここで作成
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(format!("sledge-browser-data-{}", label));
    // ディレクトリがなければ作っておく
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    builder = builder.additional_browser_args(COMMON_BROWSER_ARGS);

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}
