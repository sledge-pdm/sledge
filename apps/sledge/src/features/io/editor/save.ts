import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { ensureAppConfigPath } from '~/features/config';
import { getEditorStateStore } from '~/stores/EditorStores';

export async function saveEditorState() {
  try {
    await ensureAppConfigPath();

    const editorState = getEditorStateStore();
    await writeTextFile(Consts.editorStateFileName, JSON.stringify(editorState, null, 2), {
      baseDir: BaseDirectory.AppConfig,
      create: true,
    });
    console.log('editor state saved:', editorState);
  } catch (e) {
    console.error('editor state save failed.', e);
    throw e;
  }
}
