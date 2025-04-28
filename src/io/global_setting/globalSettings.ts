import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { globalStore, setGlobalStore } from '~/stores/GlobalStores';

const FILE_NAME = 'global.sledgeconfig';

export async function saveGlobalSettings() {
  try {
    const json = JSON.stringify(globalStore);
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    await writeTextFile(FILE_NAME, json, { baseDir: BaseDirectory.AppConfig });
    console.log('[globalIO] 設定保存完了');
  } catch (e) {
    console.error('[globalIO] 設定保存失敗', e);
  }
}

export async function loadGlobalSettings() {
  try {
    const json = await readTextFile(FILE_NAME, {
      baseDir: BaseDirectory.AppConfig,
    });
    const data = JSON.parse(json);

    // data の各キーをまとめてストアに反映
    // createStore の setter はオブジェクトを渡すだけで部分更新してくれます
    setGlobalStore(data);

    console.log('[globalIO] 設定読み込み完了', data);
  } catch (e) {
    console.warn('[globalIO] 設定ファイルが存在しないか、読み込み失敗:', e);
  }
}
