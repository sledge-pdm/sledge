import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/models/Consts';
import { getGlobalRootStore } from '~/stores/GlobalStores';
import { emitGlobalEvent } from '~/utils/TauriUtils';

export async function saveGlobalSettings() {
  try {
    const config = getGlobalRootStore();
    const configData = await writeTextFile(Consts.globalConfigFileName, JSON.stringify(config), {
      baseDir: BaseDirectory.AppConfig,
    });
    await emitGlobalEvent('onSettingsSaved', { config: configData });
    console.log('global settings saved:', configData);
  } catch (e) {
    console.error('global settings save failed.', e);
    throw e;
  }
}
