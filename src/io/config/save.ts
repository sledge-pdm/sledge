import { invoke } from '@tauri-apps/api/core';
import { getGlobalRootStore } from '~/stores/GlobalStores';

export async function saveGlobalSettings() {
  try {
    const config = getGlobalRootStore();
    await invoke('save_global_config', { config });
    console.log('global settings save done (via Rust).');
  } catch (e) {
    console.error('global settings save failed (via Rust).', e);
    throw e;
  }
}
