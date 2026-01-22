use serde::Serialize;
use tauri::{Manager, ResourceId, Runtime, Webview};
use tauri_plugin_updater::{Update, UpdaterExt};
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

#[derive(Copy, Clone)]
struct ChannelSelection {
    stable: bool,
    dev: bool,
}

fn parse_channels(channel: Option<&str>) -> ChannelSelection {
    let Some(channel) = channel else {
        return ChannelSelection {
            stable: true,
            dev: false,
        };
    };

    let mut selection = ChannelSelection {
        stable: false,
        dev: false,
    };

    for token in channel.split(|c| matches!(c, '|' | ',' | ' ' | '\t')) {
        match token {
            "stable" => selection.stable = true,
            "dev" => selection.dev = true,
            _ => {}
        }
    }

    if !selection.stable && !selection.dev {
        ChannelSelection {
            stable: true,
            dev: false,
        }
    } else {
        selection
    }
}

const STABLE_ENDPOINT: &str =
    "https://github.com/sledge-pdm/sledge/releases/latest/download/latest.json";
const DEV_ENDPOINT: &str =
    "https://github.com/sledge-pdm/sledge/releases/download/dev-latest/latest.json";

fn parse_version(value: &str) -> Option<semver::Version> {
    semver::Version::parse(value.trim_start_matches('v')).ok()
}

fn select_latest_update(stable: Option<Update>, dev: Option<Update>) -> Option<Update> {
    match (stable, dev) {
        (Some(stable), Some(dev)) => {
            let stable_version = parse_version(&stable.version);
            let dev_version = parse_version(&dev.version);
            match (stable_version, dev_version) {
                (Some(stable_version), Some(dev_version)) => {
                    if stable_version >= dev_version {
                        Some(stable)
                    } else {
                        Some(dev)
                    }
                }
                (Some(_), None) => Some(stable),
                (None, Some(_)) => Some(dev),
                (None, None) => Some(stable),
            }
        }
        (Some(stable), None) => Some(stable),
        (None, Some(dev)) => Some(dev),
        (None, None) => None,
    }
}

async fn check_with_endpoint<R: Runtime>(
    webview: &Webview<R>,
    endpoint: Option<Url>,
    headers: Option<Vec<(String, String)>>,
    timeout: Option<u64>,
    proxy: Option<String>,
    target: Option<String>,
    allow_downgrades: Option<bool>,
) -> Result<Option<Update>, String> {
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
    if let Some(endpoint) = endpoint {
        builder = builder
            .endpoints(vec![endpoint])
            .map_err(|e| format!("Failed to set endpoints: {e}"))?;
    }

    let updater = builder.build().map_err(|e| e.to_string())?;
    updater.check().await.map_err(|e| e.to_string())
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
    let stable_endpoint = Url::parse(STABLE_ENDPOINT).ok();
    let dev_endpoint = Url::parse(DEV_ENDPOINT).ok();

    let selection = parse_channels(channel.as_deref());

    let update = if selection.dev && selection.stable {
        let stable = check_with_endpoint(
            &webview,
            stable_endpoint,
            headers.clone(),
            timeout,
            proxy.clone(),
            target.clone(),
            allow_downgrades,
        )
        .await?;
        let dev = check_with_endpoint(
            &webview,
            dev_endpoint,
            headers,
            timeout,
            proxy,
            target,
            allow_downgrades,
        )
        .await?;
        select_latest_update(stable, dev)
    } else if selection.dev {
        check_with_endpoint(
            &webview,
            dev_endpoint,
            headers,
            timeout,
            proxy,
            target,
            allow_downgrades,
        )
        .await?
    } else {
        check_with_endpoint(
            &webview,
            stable_endpoint,
            headers,
            timeout,
            proxy,
            target,
            allow_downgrades,
        )
        .await?
    };

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
