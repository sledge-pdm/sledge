import { invoke } from '@tauri-apps/api/core';
import { defaultConfig } from '~/models/config/GlobalConfig';
import { defaultLastSettingsStore, loadGlobalStore, makeDefaultKeyConfigStore } from '~/stores/GlobalStores';

export default async function loadGlobalSettingsRust() {
  try {
    const data = await invoke('load_global_config');

    // 空のJSONの場合はデフォルト値を使用
    if (!data || Object.keys(data).length === 0) {
      loadGlobalStore({
        globalConfigStore: defaultConfig,
        keyConfigStore: makeDefaultKeyConfigStore(),
        lastSettingsStore: defaultLastSettingsStore,
      });
    } else {
      loadGlobalStore(
        Object.assign(
          {
            globalConfigStore: defaultConfig,
            keyConfigStore: makeDefaultKeyConfigStore(),
            lastSettingsStore: defaultLastSettingsStore,
          },
          data
        )
      );
    }

    console.log('global settings load done (via Rust).', data);
  } catch (e) {
    console.error('global settings load failed (via Rust).', e);
    // フォールバック: デフォルト値を読み込み
    loadGlobalStore({
      globalConfigStore: defaultConfig,
      keyConfigStore: makeDefaultKeyConfigStore(),
      lastSettingsStore: defaultLastSettingsStore,
    });
  }
}
