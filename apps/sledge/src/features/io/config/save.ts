import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { ensureAppConfigPath } from '~/features/config';
import { getFallbackedSettings } from '~/features/io/config/set';
import { logSystemError } from '~/features/log/service';
import { getGlobalRootStore } from '~/stores/GlobalStores';
import { emitGlobalEvent } from '~/utils/TauriUtils';

const LOG_LABEL = 'ConfigSave';

export async function saveGlobalSettings(triggerGlobalEvent: boolean) {
  try {
    await ensureAppConfigPath();

    const config = getGlobalRootStore();
    const fbConfig = getFallbackedSettings(config);
    await writeTextFile(Consts.globalConfigFileName, JSON.stringify(fbConfig, null, 2), {
      baseDir: BaseDirectory.AppConfig,
      create: true,
    });
    if (triggerGlobalEvent) await emitGlobalEvent('onSettingsSaved', { config: fbConfig });
  } catch (e) {
    logSystemError('global settings save failed.', { label: LOG_LABEL, details: [e] });
    throw e;
  }
}
