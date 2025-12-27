import { getTauriVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { EventCallback, listen } from '@tauri-apps/api/event';
import { logSystemError, logSystemWarn } from '~/features/log/service';

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

export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  if (!(await isTauri())) {
    logSystemWarn(`[safeInvoke] '${cmd}' skipped (not in Tauri environment)`, { label: 'TauriUtils', debugOnly: true });
    return undefined;
  }

  try {
    const result = await invoke<T>(cmd, args);
    return result;
  } catch (e) {
    logSystemError(`[safeInvoke] '${cmd}' failed`, { label: 'TauriUtils', details: [e] });
    return undefined;
  }
}

export type TauriGlobalEvent = 'onSettingsSaved';

export async function emitGlobalEvent(event: TauriGlobalEvent, msg?: Object) {
  return await safeInvoke('emit_global_event', { event, msg });
}

export function listenEvent(event: TauriGlobalEvent, handler: EventCallback<any>) {
  return listen(event, handler);
}
