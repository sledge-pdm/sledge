#[tauri::command]
pub async fn reveal_native_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        reveal_on_windows(path)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("reveal_native_path is only supported on Windows.".into())
    }
}

#[cfg(target_os = "windows")]
fn reveal_on_windows(path: String) -> Result<(), String> {
    use std::path::Path;
    use std::process::Command;

    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Path is empty.".into());
    }
    let trimmed = trimmed.to_string();

    let metadata = std::fs::metadata(&trimmed).ok();
    let mut command = Command::new("explorer");

    if metadata.as_ref().map(|m| m.is_file()).unwrap_or(false) {
        command.arg(format!("/select,{}", &trimmed));
    } else {
        let target = if metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false) {
            trimmed.clone()
        } else {
            Path::new(&trimmed)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or(trimmed.clone())
        };
        command.arg(target);
    }

    command
        .status()
        .map_err(|e| format!("Failed to open Explorer: {e}"))?;
    Ok(())
}
