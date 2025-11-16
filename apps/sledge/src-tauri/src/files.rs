#[cfg(target_os = "windows")]
use std::path::{Path, PathBuf};

#[tauri::command]
pub async fn reveal_native_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        reveal_native_path_windows(path)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("reveal_native_path is only supported on Windows.".into())
    }
}

#[cfg(target_os = "windows")]
fn reveal_native_path_windows(path: String) -> Result<(), String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Path is empty.".into());
    }

    let normalized = prepare_windows_path(trimmed)?;
    reveal_paths_in_explorer(&[normalized])
}

#[cfg(target_os = "windows")]
fn prepare_windows_path(input: &str) -> Result<std::path::PathBuf, String> {
    use std::{env, fs};

    let path = Path::new(input);
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        env::current_dir()
            .map_err(|e| format!("Failed to determine current directory: {e}"))?
            .join(path)
    };

    let resolved = if fs::metadata(&absolute).is_ok() {
        fs::canonicalize(&absolute).unwrap_or_else(|_| absolute.clone())
    } else {
        absolute.clone()
    };

    let stripped = strip_extended_prefix(&resolved);
    if let Some(mapped) = map_unc_to_mapped_drive(&stripped) {
        return Ok(mapped);
    }

    Ok(stripped)
}

#[cfg(target_os = "windows")]
fn strip_extended_prefix(path: &std::path::Path) -> std::path::PathBuf {
    let display = path.display().to_string();
    if display.starts_with(r"\\?\UNC\") {
        std::path::PathBuf::from(format!(r"\\{}", &display[8..]))
    } else if display.starts_with(r"\\?\") {
        std::path::PathBuf::from(&display[4..])
    } else {
        path.to_path_buf()
    }
}

#[cfg(target_os = "windows")]
fn map_unc_to_mapped_drive(path: &Path) -> Option<PathBuf> {
    let target = path.to_string_lossy().replace('/', "\\");
    if !target.starts_with(r"\\") {
        return None;
    }

    let mask = fetch_drive_mask().ok()?;
    let letters = defined_drive_letters_from_mask(mask);
    let target_lower = target.to_ascii_lowercase();

    for drive in letters {
        if let Some(unc) = get_unc_for_drive_letter(drive) {
            let normalized_unc = unc.replace('/', "\\").trim_end_matches('\\').to_string();
            let normalized_unc_lower = normalized_unc.to_ascii_lowercase();
            if normalized_unc.len() > target.len() {
                continue;
            }
            if target_lower == normalized_unc_lower
                || target_lower.starts_with(&(normalized_unc_lower.clone() + "\\"))
            {
                let prefix_len = normalized_unc.len();
                if prefix_len > target.len() {
                    continue;
                }
                let remainder = &target[prefix_len..];
                let remainder_trimmed = remainder.trim_start_matches('\\');
                let mut local = PathBuf::from(format!("{drive}:\\"));
                if !remainder_trimmed.is_empty() {
                    local.push(Path::new(remainder_trimmed));
                }
                return Some(local);
            }
        }
    }

    None
}

#[cfg(target_os = "windows")]
fn fetch_drive_mask() -> Result<u32, String> {
    use windows::Win32::Storage::FileSystem::GetLogicalDrives;

    let mask = unsafe { GetLogicalDrives() };
    if mask == 0 {
        Err("GetLogicalDrives failed".into())
    } else {
        Ok(mask)
    }
}

#[cfg(target_os = "windows")]
fn defined_drive_letters_from_mask(mask: u32) -> Vec<char> {
    (0..26)
        .filter_map(|bit| {
            if mask & (1 << bit) != 0 {
                Some((b'A' + bit) as char)
            } else {
                None
            }
        })
        .collect()
}

#[cfg(target_os = "windows")]
fn available_drive_letters_from_mask(mask: u32) -> Vec<char> {
    (0..26)
        .filter_map(|bit| {
            if mask & (1 << bit) == 0 {
                Some((b'A' + bit) as char)
            } else {
                None
            }
        })
        .collect()
}

#[cfg(target_os = "windows")]
fn get_unc_for_drive_letter(drive: char) -> Option<String> {
    use std::iter;
    use windows::Win32::Foundation::{ERROR_MORE_DATA, NO_ERROR};
    use windows::Win32::NetworkManagement::WNet::{
        UNIVERSAL_NAME_INFO_LEVEL, UNIVERSAL_NAME_INFOW, WNetGetUniversalNameW,
    };

    let drive_path = format!("{drive}:\\");
    let drive_utf16: Vec<u16> = drive_path.encode_utf16().chain(iter::once(0)).collect();

    let mut buffer = vec![0u8; 1024];
    loop {
        let mut buffer_size = buffer.len() as u32;
        let result = unsafe {
            WNetGetUniversalNameW(
                windows::core::PCWSTR(drive_utf16.as_ptr()),
                UNIVERSAL_NAME_INFO_LEVEL,
                buffer.as_mut_ptr() as *mut _,
                &mut buffer_size,
            )
        };

        match result {
            NO_ERROR => {
                let info = unsafe { &*(buffer.as_ptr() as *const UNIVERSAL_NAME_INFOW) };
                let ptr = info.lpUniversalName;
                if ptr.0.is_null() {
                    return None;
                }
                let len = wide_len(ptr.0);
                let slice = unsafe { std::slice::from_raw_parts(ptr.0, len) };
                return Some(String::from_utf16_lossy(slice));
            }
            ERROR_MORE_DATA => {
                buffer.resize(buffer_size as usize, 0);
            }
            _ => return None,
        }
    }
}

#[cfg(target_os = "windows")]
fn wide_len(ptr: *const u16) -> usize {
    if ptr.is_null() {
        return 0;
    }
    let mut len = 0;
    unsafe {
        while *ptr.add(len) != 0 {
            len += 1;
        }
    }
    len
}

#[cfg(target_os = "windows")]
fn reveal_paths_in_explorer(paths: &[std::path::PathBuf]) -> Result<(), String> {
    if paths.is_empty() {
        return Ok(());
    }

    use std::collections::HashMap;

    let mut grouped_paths: HashMap<std::path::PathBuf, Vec<std::path::PathBuf>> = HashMap::new();
    let mut standalone_paths = Vec::new();

    for path in paths {
        if let Some(parent) = path.parent() {
            grouped_paths
                .entry(parent.to_path_buf())
                .or_default()
                .push(path.clone());
        } else {
            standalone_paths.push(path.clone());
        }
    }

    let _ = unsafe { windows::Win32::System::Com::CoInitialize(None) };

    for path in standalone_paths {
        shell_execute_path(&path)?;
    }

    for (parent, selections) in grouped_paths {
        let parent_item = OwnedItemIdList::new(&parent)?;

        let selected_items = selections
            .iter()
            .map(|path| OwnedItemIdList::new(path))
            .collect::<Result<Vec<_>, String>>()?;

        let result = unsafe {
            windows::Win32::UI::Shell::SHOpenFolderAndSelectItems(
                parent_item.item,
                Some(
                    &selected_items
                        .iter()
                        .map(|item| item.item)
                        .collect::<Vec<_>>(),
                ),
                0,
            )
        };

        if let Err(error) = result {
            if error.code().0 == windows::Win32::Foundation::ERROR_FILE_NOT_FOUND.0 as i32 {
                shell_execute_path(&selections[0])?;
            } else {
                return Err(format!("Failed to open Explorer: {error:?}"));
            }
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn shell_execute_path(path: &std::path::Path) -> Result<(), String> {
    use std::fs;

    let metadata = fs::metadata(path).ok();
    let is_dir = metadata.map(|m| m.is_dir()).unwrap_or(false);

    let path_hstring = windows::core::HSTRING::from(path);
    let mut info = windows::Win32::UI::Shell::SHELLEXECUTEINFOW {
        cbSize: std::mem::size_of::<windows::Win32::UI::Shell::SHELLEXECUTEINFOW>() as u32,
        nShow: windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL.0,
        lpFile: windows::core::PCWSTR(path_hstring.as_ptr()),
        lpClass: if is_dir {
            windows::core::w!("folder")
        } else {
            windows::core::PCWSTR::null()
        },
        lpVerb: if is_dir {
            windows::core::w!("explore")
        } else {
            windows::core::PCWSTR::null()
        },
        ..Default::default()
    };

    unsafe { windows::Win32::UI::Shell::ShellExecuteExW(&mut info) }
        .map_err(|e| format!("Explorer fallback failed: {e:?}"))?;

    Ok(())
}

#[cfg(target_os = "windows")]
struct OwnedItemIdList {
    _hstring: windows::core::HSTRING,
    item: *const windows::Win32::UI::Shell::Common::ITEMIDLIST,
}

#[cfg(target_os = "windows")]
impl OwnedItemIdList {
    fn new(path: &std::path::Path) -> Result<Self, String> {
        let path_hstring = windows::core::HSTRING::from(path);
        let item = unsafe { windows::Win32::UI::Shell::ILCreateFromPathW(&path_hstring) };
        if item.is_null() {
            Err(format!(
                "Failed to convert path '{}' to ITEMIDLIST",
                path.display()
            ))
        } else {
            Ok(Self {
                _hstring: path_hstring,
                item,
            })
        }
    }
}

#[cfg(target_os = "windows")]
impl Drop for OwnedItemIdList {
    fn drop(&mut self) {
        if !self.item.is_null() {
            unsafe { windows::Win32::UI::Shell::ILFree(Some(self.item)) };
        }
    }
}

#[cfg(target_os = "windows")]
#[tauri::command(async)]
pub async fn get_available_drive_letters() -> Result<Vec<char>, String> {
    let mask = fetch_drive_mask()?;
    Ok(available_drive_letters_from_mask(mask))
}

#[cfg(target_os = "windows")]
#[tauri::command(async)]
pub async fn get_defined_drive_letters() -> Result<Vec<char>, String> {
    let mask = fetch_drive_mask()?;
    Ok(defined_drive_letters_from_mask(mask))
}
