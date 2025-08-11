import { BaseDirectory, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/models/Consts';
import { getGlobalRootStore } from '~/stores/GlobalStores';
import { emitGlobalEvent } from '~/utils/TauriUtils';

export async function saveGlobalSettings() {
  try {
    const config = getGlobalRootStore();
    await mkdir('', { baseDir: BaseDirectory.AppConfig });
    const configData = await writeTextFile(Consts.globalConfigFileName, JSON.stringify(config), {
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
