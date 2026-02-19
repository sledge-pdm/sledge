import { logSystemWarn } from '~/features/log/service';
import { formatNativePath } from '~/utils/FileUtils';
import { opener, os } from './platform';
import { isTauri, safeInvoke } from './TauriUtils';

export async function revealInFileBrowser(path: string): Promise<void> {
  const normalized = formatNativePath(path);
  const currentPlatform = os.platform();

  if (currentPlatform === 'windows' && (await isTauri())) {
    try {
      await safeInvoke('reveal_native_path', { path: normalized });
      return;
    } catch (error) {
      logSystemWarn('reveal_native_path failed, falling back to plugin opener', { label: 'NativeOpener', details: [error] });
    }
  }

  await opener.revealItemInDir(normalized);
}
