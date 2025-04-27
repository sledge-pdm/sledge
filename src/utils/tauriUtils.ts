import { getTauriVersion } from '@tauri-apps/api/app';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';

let _isTauri: boolean | null = null;

export async function isTauri(): Promise<boolean> {
  if (_isTauri !== null) return _isTauri;
  try {
    await getTauriVersion();
    _isTauri = true;
  } catch {
    _isTauri = false;
  }
  return _isTauri;
}

export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T | undefined> {
  if (!(await isTauri())) {
    console.warn(`[safeInvoke] '${cmd}' skipped (not in Tauri environment)`);
    return undefined;
  }

  try {
    const result = await tauriInvoke<T>(cmd, args);
    return result;
  } catch (e) {
    console.error(`[safeInvoke] '${cmd}' failed:`, e);
    return undefined;
  }
}
