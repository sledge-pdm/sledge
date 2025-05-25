use serde::Deserialize;
use tauri::{AppHandle, Manager, Theme, WebviewUrl, WebviewWindowBuilder};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SledgeWindowKind {
    Start,
    Editor,
    About,
    Settings,
}

const COMMON_BROWSER_ARGS: &str = "--enable-features=msWebView2EnableDraggableRegions --disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection";

fn next_editor_label(app: &AppHandle) -> String {
    loop {
        // 例: "editor-31d15a92"
        let label = format!(
            "editor-{}",
            Uuid::new_v4().simple().to_string()[..8].to_owned()
        );
        if app.get_webview_window(&label).is_none() {
            return label;
        }
    }
}

#[tauri::command]
pub async fn open_window(
    app: AppHandle,
    kind: SledgeWindowKind,
    query: Option<String>,
) -> Result<(), String> {
    use SledgeWindowKind::*;

    let label;
    let (_url, mut builder) = match kind {
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
            let label = next_editor_label(&app);

            let base_url = "/editor";
            let full_url = query
                .as_ref()
                .map(|q| format!("{base_url}?{q}"))
                .unwrap_or_else(|| base_url.to_string());
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

    builder = builder
        .focused(true)
        .theme(Some(Theme::Light))
        .additional_browser_args(COMMON_BROWSER_ARGS);

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}
