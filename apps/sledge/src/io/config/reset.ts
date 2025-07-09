import { safeInvoke } from '~/utils/TauriUtils';

export async function resetToDefaultConfig() {
  try {
    // デフォルト値をストアに読み込み
    const res = await safeInvoke('reset_global_config');

    console.log('global settings reset done (via Rust).');
  } catch (e) {
    console.error('global settings reset failed (via Rust).', e);
    throw e;
  }
}
