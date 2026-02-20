import { core, event, EventCallback } from './platform';

export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  if (!core.isTauri()) {
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
  if (!core.isTauri()) return undefined;
  return await safeInvoke('emit_global_event', { event, msg });
}

export function listenEvent(e: TauriGlobalEvent, handler: EventCallback<any>) {
  return event.listen(e, handler);
}
