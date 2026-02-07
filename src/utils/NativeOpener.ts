import { logSystemWarn } from '~/features/log/service';
import { formatNativePath } from '~/utils/FileUtils';
import { core, opener, os } from './platform';

export async function revealInFileBrowser(path: string): Promise<void> {
  const normalized = formatNativePath(path);
  const currentPlatform = os.platform();

  if (currentPlatform === 'windows') {
    try {
      await core.invoke('reveal_native_path', { path: normalized });
      return;
    } catch (error) {
      logSystemWarn('reveal_native_path failed, falling back to plugin opener', { label: 'NativeOpener', details: [error] });
    }
  }

  await opener.revealItemInDir(normalized);
}
