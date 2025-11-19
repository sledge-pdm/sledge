import { invoke } from '@tauri-apps/api/core';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { platform } from '@tauri-apps/plugin-os';
import { logSystemWarn } from '~/features/log/service';
import { formatNativePath } from '~/utils/FileUtils';

export async function revealInFileBrowser(path: string): Promise<void> {
  const normalized = formatNativePath(path);
  const currentPlatform = platform();

  if (currentPlatform === 'windows') {
    try {
      await invoke('reveal_native_path', { path: normalized });
      return;
    } catch (error) {
      logSystemWarn('reveal_native_path failed, falling back to plugin opener', { label: 'NativeOpener', details: [error] });
    }
  }

  await revealItemInDir(normalized);
}
