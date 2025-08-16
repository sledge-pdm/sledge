import { BaseDirectory, exists, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { getFallbackedSettings } from '~/io/config/set';
import { Consts } from '~/models/Consts';
import { getGlobalRootStore } from '~/stores/GlobalStores';
import { emitGlobalEvent } from '~/utils/TauriUtils';

export async function saveGlobalSettings() {
  try {
    const config = getGlobalRootStore();
    const fbConfig = getFallbackedSettings(config);
    if (!exists('', { baseDir: BaseDirectory.AppConfig })) {
      await mkdir('', { baseDir: BaseDirectory.AppConfig });
    }
    const configData = await writeTextFile(Consts.globalConfigFileName, JSON.stringify(fbConfig, null, 2), {
      baseDir: BaseDirectory.AppConfig,
      create: true,
    });
    await emitGlobalEvent('onSettingsSaved', { config: configData });
    console.log('global settings saved:', configData);
  } catch (e) {
    console.error('global settings save failed.', e);
    throw e;
  }
}
