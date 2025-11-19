import { debounce } from '@solid-primitives/scheduled';
import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { ensureAppConfigPath } from '~/features/config';
import { logSystemError } from '~/features/log/service';
import { getEditorStateStore } from '~/stores/EditorStores';

export const saveEditorStateDebounced = debounce(saveEditorStateImmediate, 500);

const LOG_LABEL = 'EditorState';

export async function saveEditorStateImmediate() {
  try {
    await ensureAppConfigPath();

    const editorState = getEditorStateStore();
    await writeTextFile(Consts.editorStateFileName, JSON.stringify(editorState, null, 2), {
      baseDir: BaseDirectory.AppConfig,
      create: true,
    });
  } catch (e) {
    logSystemError('editor state save failed.', { label: LOG_LABEL, details: [e] });
    throw e;
  }
}
