use serde::Serialize;
use std::env;
use tauri::{Manager, ResourceId, Runtime, Webview};
use tauri_plugin_updater::UpdaterExt;
use url::Url;

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Metadata {
    rid: ResourceId,
    current_version: String,
    version: String,
    date: Option<String>,
    body: Option<String>,
    raw_json: serde_json::Value,
}

fn is_dev_channel(channel: Option<&str>) -> bool {
    matches!(channel, Some("dev" | "rust"))
}

fn read_endpoint_from_env(key: &str) -> Option<Url> {
    env::var(key)
        .ok()
        .and_then(|value| Url::parse(value.trim()).ok())
}

#[tauri::command]
pub(crate) async fn check_update_with_channel<R: Runtime>(
    webview: Webview<R>,
    channel: Option<String>,
    headers: Option<Vec<(String, String)>>,
    timeout: Option<u64>,
    proxy: Option<String>,
    target: Option<String>,
    allow_downgrades: Option<bool>,
) -> Result<Option<Metadata>, String> {
    let _ = dotenvy::dotenv();
    let mut builder = webview.updater_builder();

    if let Some(headers) = headers {
        for (k, v) in headers {
            builder = builder
                .header(k, v)
                .map_err(|e| format!("Failed to add header: {e}"))?;
        }
    }
    if let Some(timeout) = timeout {
        builder = builder.timeout(std::time::Duration::from_millis(timeout));
    }
    if let Some(ref proxy) = proxy {
        let url = Url::parse(proxy.as_str()).map_err(|e| format!("Invalid proxy URL: {e}"))?;
        builder = builder.proxy(url);
    }
    if let Some(target) = target {
        builder = builder.target(target);
    }
    if allow_downgrades.unwrap_or(false) {
        builder = builder.version_comparator(|current, update| update.version != current);
    }

    let stable_endpoint = read_endpoint_from_env("SLEDGE_UPDATER_STABLE_ENDPOINT");
    let dev_endpoint = read_endpoint_from_env("SLEDGE_UPDATER_DEV_ENDPOINT");

    if is_dev_channel(channel.as_deref()) {
        if let Some(dev_endpoint) = dev_endpoint {
            builder = builder
                .endpoints(vec![dev_endpoint])
                .map_err(|e| format!("Failed to set dev endpoints: {e}"))?;
        }
    } else if let Some(stable_endpoint) = stable_endpoint {
        builder = builder
            .endpoints(vec![stable_endpoint])
            .map_err(|e| format!("Failed to set stable endpoints: {e}"))?;
    }

    let updater = builder.build().map_err(|e| e.to_string())?;
    let update = updater.check().await.map_err(|e| e.to_string())?;

    if let Some(update) = update {
        let formatted_date = update.date.map(|date| date.to_string());
        let metadata = Metadata {
            current_version: update.current_version.clone(),
            version: update.version.clone(),
            date: formatted_date,
            body: update.body.clone(),
            raw_json: update.raw_json.clone(),
            rid: webview.resources_table().add(update),
        };
        Ok(Some(metadata))
    } else {
        Ok(None)
    }
}
