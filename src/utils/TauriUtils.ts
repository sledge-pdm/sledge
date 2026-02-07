import { app, core, event, EventCallback } from './platform';

let _isTauri: boolean | null = null;

export async function isTauri(): Promise<boolean> {
  if (_isTauri !== null) return _isTauri;
  try {
    await app.getTauriVersion();
    _isTauri = true;
  } catch {
    _isTauri = false;
  }
  return _isTauri;
}

export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  if (!(await isTauri())) {
    throw new Error(`[safeInvoke] '${cmd}' skipped (not in Tauri environment)`);
  }

  try {
    const result = await core.invoke<T>(cmd, args);
    return result;
  } catch (e) {
    throw new Error(`[safeInvoke] '${cmd}' failed.\n${e}`);
  }
}

export type TauriGlobalEvent = 'onSettingsSaved';

export async function emitGlobalEvent(event: TauriGlobalEvent, msg?: Object) {
  return await safeInvoke('emit_global_event', { event, msg });
}

export function listenEvent(e: TauriGlobalEvent, handler: EventCallback<any>) {
  return event.listen(e, handler);
}
