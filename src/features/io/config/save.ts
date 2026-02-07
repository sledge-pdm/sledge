import { Consts } from '~/Consts';
import { ensureAppConfigPath } from '~/features/config';
import { getFallbackedSettings } from '~/features/io/config/set';
import { logSystemError } from '~/features/log/service';
import { getGlobalRootStore } from '~/stores/GlobalStores';
import { fs } from '~/utils/platform';
import { emitGlobalEvent } from '~/utils/TauriUtils';

const LOG_LABEL = 'ConfigSave';

export async function saveGlobalSettings(triggerGlobalEvent: boolean) {
  try {
    await ensureAppConfigPath();

    const config = getGlobalRootStore();
    const fbConfig = getFallbackedSettings(config);
    const baseDir = fs.BaseDirectory?.AppConfig;
    await fs.writeTextFile(Consts.globalConfigFileName, JSON.stringify(fbConfig, null, 2), {
      baseDir,
      create: true,
    });
    if (triggerGlobalEvent) await emitGlobalEvent('onSettingsSaved', { config: fbConfig });
  } catch (e) {
    logSystemError('global settings save failed.', { label: LOG_LABEL, details: [e] });
    throw e;
  }
}
