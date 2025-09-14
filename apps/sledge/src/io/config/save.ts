import { BaseDirectory, exists, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { getFallbackedSettings } from '~/io/config/set';
import { getGlobalRootStore } from '~/stores/GlobalStores';
import { emitGlobalEvent } from '~/utils/TauriUtils';

export async function saveGlobalSettings(triggerGlobalEvent: boolean) {
  try {
    const config = getGlobalRootStore();
    const fbConfig = getFallbackedSettings(config);
    if (!(await exists('', { baseDir: BaseDirectory.AppConfig }))) {
      await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    }
    await writeTextFile(Consts.globalConfigFileName, JSON.stringify(fbConfig, null, 2), {
      baseDir: BaseDirectory.AppConfig,
      create: true,
    });
    if (triggerGlobalEvent) await emitGlobalEvent('onSettingsSaved', { config: fbConfig });
    console.log('global settings saved:', fbConfig);
  } catch (e) {
    console.error('global settings save failed.', e);
    throw e;
  }
}
